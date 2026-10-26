const assert = require("node:assert/strict");

const {
  after,
  before,
  test
} = require("node:test");

const {
  createAuthorizationFixture,
  startApplication
} = require(
  "./support/authorization-fixture"
);

let application;
let fixture;

before(async () => {
  fixture =
    await createAuthorizationFixture({
      prefix: "CONTEXT",
      includeNoMembership: false
    });

  application =
    await startApplication({
      mockOpenAI: true
    });
});

after(async () => {
  await application.stop();
  await fixture.cleanup();
});

async function askQuestion(
  accessToken
) {
  const question =
    "Which relevant organizational guidance applies?";

  const response =
    await fetch(
      `${application.baseUrl}/ask?question=${
        encodeURIComponent(question)
      }`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

  return {
    status: response.status,
    body: await response.json()
  };
}

function assertIsolatedContext({
  response,
  authorizedKnowledge,
  unauthorizedKnowledge
}) {
  const evidence =
    JSON.stringify(
      response.body.evidence
    );

  const modelContext =
    response.body.answer;

  assert.equal(
    response.status,
    200
  );

  assert.equal(
    evidence.includes(
      authorizedKnowledge
    ),
    true
  );

  assert.equal(
    evidence.includes(
      unauthorizedKnowledge
    ),
    false
  );

  assert.equal(
    modelContext.includes(
      authorizedKnowledge
    ),
    true
  );

  assert.equal(
    modelContext.includes(
      unauthorizedKnowledge
    ),
    false
  );
}

test(
  "User A evidence and model context include A but exclude B",
  async () => {
    const response =
      await askQuestion(
        fixture.users.a.accessToken
      );

    assertIsolatedContext({
      response,
      authorizedKnowledge:
        fixture.knowledge.a,
      unauthorizedKnowledge:
        fixture.knowledge.b
    });
  }
);

test(
  "User B evidence and model context include B but exclude A",
  async () => {
    const response =
      await askQuestion(
        fixture.users.b.accessToken
      );

    assertIsolatedContext({
      response,
      authorizedKnowledge:
        fixture.knowledge.b,
      unauthorizedKnowledge:
        fixture.knowledge.a
    });
  }
);
