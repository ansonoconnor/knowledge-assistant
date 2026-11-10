const assert = require("node:assert/strict");

const {
  after,
  before,
  test
} = require("node:test");

const {
  createAuthorizationFixture
} = require(
  "./support/authorization-fixture"
);

let fixture;

before(async () => {
  fixture =
    await createAuthorizationFixture({
      prefix: "RETRIEVAL"
    });
});

after(async () => {
  await fixture.cleanup();
});

test(
  "User A retrieves Organization A knowledge but not Organization B knowledge",
  async () => {
    const allowed =
      await fixture.retrieve(
        fixture.users.a.client,
        fixture.organizations.a,
        fixture.embeddings.a
      );

    const denied =
      await fixture.retrieve(
        fixture.users.a.client,
        fixture.organizations.b,
        fixture.embeddings.b
      );

    assert.deepEqual(
      allowed.map((row) => row.title),
      [fixture.titles.a]
    );

    assert.deepEqual(denied, []);
  }
);

test(
  "User B retrieves Organization B knowledge but not Organization A knowledge",
  async () => {
    const allowed =
      await fixture.retrieve(
        fixture.users.b.client,
        fixture.organizations.b,
        fixture.embeddings.b
      );

    const denied =
      await fixture.retrieve(
        fixture.users.b.client,
        fixture.organizations.a,
        fixture.embeddings.a
      );

    assert.deepEqual(
      allowed.map((row) => row.title),
      [fixture.titles.b]
    );

    assert.deepEqual(denied, []);
  }
);

test(
  "Authenticated user without membership retrieves no organizational knowledge",
  async () => {
    const rowsA =
      await fixture.retrieve(
        fixture.users.noMembership.client,
        fixture.organizations.a,
        fixture.embeddings.a
      );

    const rowsB =
      await fixture.retrieve(
        fixture.users.noMembership.client,
        fixture.organizations.b,
        fixture.embeddings.b
      );

    assert.deepEqual(rowsA, []);
    assert.deepEqual(rowsB, []);
  }
);

test(
  "Document rows are visible only within the authenticated organization",
  async () => {
    async function visibleRows(client) {
      const {
        data,
        error
      } = await client
        .from("knowledge_chunks")
        .select(
          "title, organization_id"
        )
        .in(
          "title",
          Object.values(fixture.titles)
        )
        .order(
          "title",
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

    const rowsA =
      await visibleRows(
        fixture.users.a.client
      );

    const rowsB =
      await visibleRows(
        fixture.users.b.client
      );

    const rowsWithoutMembership =
      await visibleRows(
        fixture.users.noMembership.client
      );

    assert.deepEqual(
      rowsA,
      [
        {
          title: fixture.titles.a,
          organization_id:
            fixture.organizations.a
        }
      ]
    );

    assert.deepEqual(
      rowsB,
      [
        {
          title: fixture.titles.b,
          organization_id:
            fixture.organizations.b
        }
      ]
    );

    assert.deepEqual(
      rowsWithoutMembership,
      []
    );
  }
);

test(
  "Authorized insertion preserves organization provenance",
  async () => {
    const titleA =
      `INSERT_A_SENTINEL_${fixture.runId}`;

    const titleB =
      `INSERT_B_SENTINEL_${fixture.runId}`;

    async function beginDocument(
      client,
      organizationId,
      title
    ) {
      const {
        data,
        error
      } = await client
        .rpc(
          "begin_knowledge_ingestion",
          {
            target_organization_id:
              organizationId,
            target_source_name:
              `${title}.pdf`,
            target_source_hash:
              title,
            target_expected_chunk_count: 1
          }
        )
        .single();

      assert.equal(
        error,
        null,
        error?.message
      );

      return data.document_id;
    }

    const documentA =
      await beginDocument(
        fixture.users.a.client,
        fixture.organizations.a,
        titleA
      );

    const documentB =
      await beginDocument(
        fixture.users.b.client,
        fixture.organizations.b,
        titleB
      );

    const {
      data: insertedA,
      error: errorA
    } = await fixture.users.a.client
      .from("knowledge_chunks")
      .insert({
        title: titleA,
        chunk_text:
          "Inserted by User A",
        organization_id:
          fixture.organizations.a,
        document_id:
          documentA,
        chunk_index: 0
      })
      .select(
        "title, organization_id"
      )
      .single();

    const {
      data: insertedB,
      error: errorB
    } = await fixture.users.b.client
      .from("knowledge_chunks")
      .insert({
        title: titleB,
        chunk_text:
          "Inserted by User B",
        organization_id:
          fixture.organizations.b,
        document_id:
          documentB,
        chunk_index: 0
      })
      .select(
        "title, organization_id"
      )
      .single();

    assert.equal(
      errorA,
      null,
      errorA?.message
    );

    assert.equal(
      errorB,
      null,
      errorB?.message
    );

    assert.deepEqual(
      insertedA,
      {
        title: titleA,
        organization_id:
          fixture.organizations.a
      }
    );

    assert.deepEqual(
      insertedB,
      {
        title: titleB,
        organization_id:
          fixture.organizations.b
      }
    );

    await fixture.admin
      .from("knowledge_documents")
      .delete()
      .in(
        "id",
        [
          documentA,
          documentB
        ]
      );
  }
);

test(
  "Cross-organization insertion is denied in both directions",
  async () => {
    const titleA =
      `CROSS_A_TO_B_${fixture.runId}`;

    const titleB =
      `CROSS_B_TO_A_${fixture.runId}`;

    async function beginDocument(
      client,
      organizationId,
      title
    ) {
      const {
        data,
        error
      } = await client
        .rpc(
          "begin_knowledge_ingestion",
          {
            target_organization_id:
              organizationId,
            target_source_name:
              `${title}.pdf`,
            target_source_hash:
              title,
            target_expected_chunk_count: 1
          }
        )
        .single();

      assert.equal(
        error,
        null,
        error?.message
      );

      return data.document_id;
    }

    const documentA =
      await beginDocument(
        fixture.users.a.client,
        fixture.organizations.a,
        titleA
      );

    const documentB =
      await beginDocument(
        fixture.users.b.client,
        fixture.organizations.b,
        titleB
      );

    const {
      error: errorA
    } = await fixture.users.a.client
      .from("knowledge_chunks")
      .insert({
        title: titleA,
        chunk_text:
          "User A attempted Organization B insertion",
        organization_id:
          fixture.organizations.b,
        document_id:
          documentB,
        chunk_index: 0
      });

    const {
      error: errorB
    } = await fixture.users.b.client
      .from("knowledge_chunks")
      .insert({
        title: titleB,
        chunk_text:
          "User B attempted Organization A insertion",
        organization_id:
          fixture.organizations.a,
        document_id:
          documentA,
        chunk_index: 0
      });

    assert.notEqual(errorA, null);
    assert.notEqual(errorB, null);

    const {
      data,
      error
    } = await fixture.admin
      .from("knowledge_chunks")
      .select("title")
      .in(
        "title",
        [
          titleA,
          titleB
        ]
      );

    assert.equal(
      error,
      null,
      error?.message
    );

    assert.deepEqual(data, []);

    await fixture.admin
      .from("knowledge_documents")
      .delete()
      .in(
        "id",
        [
          documentA,
          documentB
        ]
      );
  }
);
