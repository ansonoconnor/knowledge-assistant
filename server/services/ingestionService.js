const { createEmbedding } = require("./embeddingService");

function createIngestionErrorCode(error) {
  if (error?.code === "TEST_INGESTION_FAILURE") {
    return error.code;
  }

  return "INGESTION_FAILED";
}

async function beginIngestion(
  supabase,
  {
    organizationId,
    sourceName,
    sourceHash,
    expectedChunkCount
  }
) {
  const {
    data,
    error
  } = await supabase
    .rpc(
      "begin_knowledge_ingestion",
      {
        target_organization_id:
          organizationId,
        target_source_name:
          sourceName,
        target_source_hash:
          sourceHash,
        target_expected_chunk_count:
          expectedChunkCount
      }
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getPersistedChunkIndexes(
  supabase,
  documentId
) {
  const {
    data,
    error
  } = await supabase
    .from("knowledge_chunks")
    .select("chunk_index")
    .eq("document_id", documentId);

  if (error) {
    throw error;
  }

  return new Set(
    data.map((row) => row.chunk_index)
  );
}

async function persistChunk(
  supabase,
  {
    documentId,
    organizationId,
    sourceName,
    chunkIndex,
    chunkText
  }
) {
  const embedding =
    await createEmbedding(chunkText);

  const { error } = await supabase
    .from("knowledge_chunks")
    .upsert(
      {
        document_id: documentId,
        chunk_index: chunkIndex,
        title:
          `${sourceName} - Part ${chunkIndex + 1}`,
        chunk_text: chunkText,
        organization_id:
          organizationId,
        embedding
      },
      {
        onConflict:
          "document_id,chunk_index",
        ignoreDuplicates: true
      }
    );

  if (error) {
    throw error;
  }
}

async function failIngestion(
  supabase,
  documentId,
  errorCode
) {
  const {
    error
  } = await supabase.rpc(
    "fail_knowledge_ingestion",
    {
      target_document_id:
        documentId,
      target_error_code:
        errorCode
    }
  );

  if (error) {
    throw error;
  }
}

async function completeIngestion(
  supabase,
  documentId
) {
  const {
    data,
    error
  } = await supabase
    .rpc(
      "complete_knowledge_ingestion",
      {
        target_document_id:
          documentId
      }
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function ingestDocument(
  supabase,
  {
    organizationId,
    sourceName,
    sourceHash,
    chunks,
    failAfterChunk = null
  }
) {
  if (
    !organizationId ||
    !sourceName ||
    !sourceHash ||
    !Array.isArray(chunks) ||
    chunks.length === 0
  ) {
    throw new Error(
      "A valid document ingestion request is required"
    );
  }

  const ingestion =
    await beginIngestion(
      supabase,
      {
        organizationId,
        sourceName,
        sourceHash,
        expectedChunkCount:
          chunks.length
      }
    );

  if (ingestion.status === "complete") {
    return {
      documentId:
        ingestion.document_id,
      status:
        ingestion.status,
      expectedChunkCount:
        ingestion.expected_chunk_count,
      persistedChunkCount:
        ingestion.persisted_chunk_count,
      chunksProcessed: 0,
      reused: true
    };
  }

  const documentId =
    ingestion.document_id;

  try {
    const persistedChunkIndexes =
      await getPersistedChunkIndexes(
        supabase,
        documentId
      );

    let chunksProcessedThisAttempt = 0;

    for (
      let chunkIndex = 0;
      chunkIndex < chunks.length;
      chunkIndex += 1
    ) {
      if (
        persistedChunkIndexes.has(
          chunkIndex
        )
      ) {
        continue;
      }

      await persistChunk(
        supabase,
        {
          documentId,
          organizationId,
          sourceName,
          chunkIndex,
          chunkText:
            chunks[chunkIndex]
        }
      );

      chunksProcessedThisAttempt += 1;

      if (
        failAfterChunk !== null &&
        chunksProcessedThisAttempt ===
          failAfterChunk
      ) {
        const failure =
          new Error(
            "Controlled ingestion failure"
          );

        failure.code =
          "TEST_INGESTION_FAILURE";

        throw failure;
      }
    }

    const completed =
      await completeIngestion(
        supabase,
        documentId
      );

    return {
      documentId:
        completed.document_id,
      status:
        completed.status,
      expectedChunkCount:
        completed.expected_chunk_count,
      persistedChunkCount:
        completed.persisted_chunk_count,
      chunksProcessed:
        chunksProcessedThisAttempt,
      reused: false
    };
  } catch (error) {
    try {
      await failIngestion(
        supabase,
        documentId,
        createIngestionErrorCode(
          error
        )
      );
    } catch (failureStateError) {
      error.failureStateError =
        failureStateError;
    }

    throw error;
  }
}

module.exports = {
  ingestDocument
};
