const assert = require("node:assert/strict");

const {
  after,
  before,
  test
} = require("node:test");

process.env.OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  "local-integration-test-key";

require("./support/mock-openai");

const {
  ingestDocument
} = require(
  "../../services/ingestionService"
);

const {
  createAuthorizationFixture,
  createEmbedding,
  startApplication
} = require(
  "./support/authorization-fixture"
);

let application;
let fixture;
let sourceHash;
let chunks;

const sourceName =
  "RECOVERABLE_INGESTION_SENTINEL.pdf";

before(async () => {
  fixture =
    await createAuthorizationFixture({
      prefix: "RECOVERY",
      includeNoMembership: false
    });

  application =
    await startApplication({
      mockOpenAI: true
    });

  sourceHash =
    "recovery-" + fixture.runId;

  chunks = [
    "RECOVERY_CHUNK_0_" + fixture.runId,
    "RECOVERY_CHUNK_1_" + fixture.runId,
    "RECOVERY_CHUNK_2_" + fixture.runId,
    "RECOVERY_CHUNK_3_" + fixture.runId
  ];
});

after(async () => {
  await application.stop();

  await fixture.admin
    .from("knowledge_documents")
    .delete()
    .eq("source_hash", sourceHash);

  await fixture.cleanup();
});

async function getRecoveryDocument() {
  const {
    data,
    error
  } = await fixture.admin
    .from("knowledge_documents")
    .select(
      `
        id,
        organization_id,
        source_name,
        source_hash,
        status,
        expected_chunk_count,
        persisted_chunk_count,
        error_code,
        completed_at
      `
    )
    .eq("source_hash", sourceHash)
    .single();

  assert.equal(
    error,
    null,
    error?.message
  );

  return data;
}

async function getRecoveryChunks() {
  const {
    data,
    error
  } = await fixture.admin
    .from("knowledge_chunks")
    .select(
      "id, document_id, chunk_index, title, chunk_text"
    )
    .like(
      "title",
      sourceName + " - Part %"
    )
    .order(
      "chunk_index",
      {
        ascending: true
      }
    );

  assert.equal(
    error,
    null,
    error?.message
  );

  return data;
}

async function getDocumentLibrary(
  accessToken
) {
  const response =
    await fetch(
      application.baseUrl + "/documents",
      {
        headers: {
          Authorization:
            "Bearer " + accessToken
        }
      }
    );

  return {
    status: response.status,
    body: await response.json()
  };
}

async function askQuestion(
  accessToken
) {
  const response =
    await fetch(
      application.baseUrl + "/ask",
      {
        method: "POST",
        headers: {
          Authorization:
            "Bearer " + accessToken,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          question:
            "What recoverable ingestion guidance is available?"
        })
      }
    );

  return {
    status: response.status,
    body: await response.json()
  };
}

test(
  "Mid-ingestion failure remains recoverable without exposing partial knowledge",
  async () => {
    await assert.rejects(
      ingestDocument(
        fixture.users.a.client,
        {
          organizationId:
            fixture.organizations.a,
          sourceName,
          sourceHash,
          chunks,
          failAfterChunk: 2
        }
      ),
      (error) =>
        error.code ===
        "TEST_INGESTION_FAILURE"
    );

    const failedDocument =
      await getRecoveryDocument();

    assert.equal(
      failedDocument.status,
      "failed"
    );

    assert.equal(
      failedDocument.expected_chunk_count,
      4
    );

    assert.equal(
      failedDocument.persisted_chunk_count,
      2
    );

    assert.equal(
      failedDocument.error_code,
      "TEST_INGESTION_FAILURE"
    );

    assert.equal(
      failedDocument.completed_at,
      null
    );

    const partialChunks =
      await getRecoveryChunks();

    assert.deepEqual(
      partialChunks.map(
        (chunk) => chunk.chunk_index
      ),
      [0, 1]
    );

    assert.equal(
      new Set(
        partialChunks.map(
          (chunk) => chunk.document_id
        )
      ).size,
      1
    );

    assert.equal(
      partialChunks[0].document_id,
      failedDocument.id
    );

    const {
      data: userVisiblePartialChunks,
      error: partialChunkReadError
    } = await fixture.users.a.client
      .from("knowledge_chunks")
      .select(
        "id, document_id, chunk_index"
      )
      .eq(
        "document_id",
        failedDocument.id
      );

    assert.equal(
      partialChunkReadError,
      null,
      partialChunkReadError?.message
    );

    assert.deepEqual(
      userVisiblePartialChunks,
      []
    );

    const libraryWhileFailed =
      await getDocumentLibrary(
        fixture.users.a.accessToken
      );

    assert.equal(
      libraryWhileFailed.status,
      200
    );

    assert.equal(
      JSON.stringify(
        libraryWhileFailed.body
      ).includes(sourceName),
      false
    );

    const retrievalWhileFailed =
      await fixture.retrieve(
        fixture.users.a.client,
        fixture.organizations.a,
        createEmbedding(1, 1)
      );

    assert.equal(
      retrievalWhileFailed.some(
        (row) =>
          row.title.startsWith(
            sourceName
          )
      ),
      false
    );

    const answerWhileFailed =
      await askQuestion(
        fixture.users.a.accessToken
      );

    assert.equal(
      answerWhileFailed.status,
      200
    );

    const failedEvidence =
      JSON.stringify(
        answerWhileFailed.body.evidence
      );

    for (const chunk of chunks) {
      assert.equal(
        failedEvidence.includes(chunk),
        false
      );

      assert.equal(
        answerWhileFailed.body.answer
          .includes(chunk),
        false
      );
    }

    const {
      error: directCompletionError
    } = await fixture.users.a.client
      .from("knowledge_documents")
      .update({
        status: "complete"
      })
      .eq(
        "id",
        failedDocument.id
      );

    assert.notEqual(
      directCompletionError,
      null
    );

    const {
      error: prematureCompletionError
    } = await fixture.users.a.client.rpc(
      "complete_knowledge_ingestion",
      {
        target_document_id:
          failedDocument.id
      }
    );

    assert.notEqual(
      prematureCompletionError,
      null
    );

    assert.equal(
      (await getRecoveryDocument()).status,
      "failed"
    );

    const {
      error: crossOrganizationError
    } = await fixture.users.b.client.rpc(
      "begin_knowledge_ingestion",
      {
        target_organization_id:
          fixture.organizations.a,
        target_source_name:
          sourceName,
        target_source_hash:
          sourceHash,
        target_expected_chunk_count:
          chunks.length
      }
    );

    assert.notEqual(
      crossOrganizationError,
      null
    );

    const retryResult =
      await ingestDocument(
        fixture.users.a.client,
        {
          organizationId:
            fixture.organizations.a,
          sourceName,
          sourceHash,
          chunks
        }
      );

    assert.equal(
      retryResult.documentId,
      failedDocument.id
    );

    assert.equal(
      retryResult.status,
      "complete"
    );

    assert.equal(
      retryResult.persistedChunkCount,
      4
    );

    assert.equal(
      retryResult.chunksProcessed,
      2
    );

    assert.equal(
      retryResult.reused,
      false
    );

    const completedDocument =
      await getRecoveryDocument();

    assert.equal(
      completedDocument.status,
      "complete"
    );

    assert.equal(
      completedDocument.persisted_chunk_count,
      4
    );

    assert.equal(
      completedDocument.error_code,
      null
    );

    assert.notEqual(
      completedDocument.completed_at,
      null
    );

    const completedChunks =
      await getRecoveryChunks();

    assert.deepEqual(
      completedChunks.map(
        (chunk) => chunk.chunk_index
      ),
      [0, 1, 2, 3]
    );

    assert.deepEqual(
      completedChunks
        .slice(0, 2)
        .map((chunk) => chunk.id),
      partialChunks.map(
        (chunk) => chunk.id
      )
    );

    assert.equal(
      new Set(
        completedChunks.map(
          (chunk) =>
            chunk.document_id +
            ":" +
            chunk.chunk_index
        )
      ).size,
      4
    );

    const libraryAfterRetry =
      await getDocumentLibrary(
        fixture.users.a.accessToken
      );

    assert.equal(
      libraryAfterRetry.status,
      200
    );

    assert.equal(
      JSON.stringify(
        libraryAfterRetry.body
      ).includes(sourceName),
      true
    );

    const retrievalAfterRetry =
      await fixture.retrieve(
        fixture.users.a.client,
        fixture.organizations.a,
        createEmbedding(1, 1)
      );

    assert.equal(
      retrievalAfterRetry.some(
        (row) =>
          row.title.startsWith(
            sourceName
          )
      ),
      true
    );

    const answerAfterRetry =
      await askQuestion(
        fixture.users.a.accessToken
      );

    assert.equal(
      answerAfterRetry.status,
      200
    );

    const completedEvidence =
      JSON.stringify(
        answerAfterRetry.body.evidence
      );

    assert.equal(
      completedEvidence.includes(
        chunks[0]
      ),
      true
    );

    assert.equal(
      answerAfterRetry.body.answer
        .includes(chunks[0]),
      true
    );

    const completedRetry =
      await ingestDocument(
        fixture.users.a.client,
        {
          organizationId:
            fixture.organizations.a,
          sourceName,
          sourceHash,
          chunks
        }
      );

    assert.deepEqual(
      completedRetry,
      {
        documentId:
          completedDocument.id,
        status: "complete",
        expectedChunkCount: 4,
        persistedChunkCount: 4,
        chunksProcessed: 0,
        reused: true
      }
    );

    const chunksAfterCompletedRetry =
      await getRecoveryChunks();

    assert.deepEqual(
      chunksAfterCompletedRetry,
      completedChunks
    );
  }
);
