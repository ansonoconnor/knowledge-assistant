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
      `${application.baseUrl}/ask`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify({
            question
          })
      }
    );

  return {
    status: response.status,
    requestId:
      response.headers.get(
        "x-request-id"
      ),
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

test(
  "Structured logs trace the request without recording sensitive content",
  async () => {
    const question =
      "Which relevant organizational guidance applies?";

    const response =
      await askQuestion(
        fixture.users.a.accessToken
      );

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 50)
    );

    const entries =
      application
        .getOutput()
        .split("\n")
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(
          (entry) =>
            entry.requestId ===
            response.requestId
        );

    const events =
      entries.map(
        (entry) => entry.event
      );

    assert.deepEqual(
      events,
      [
        "request.received",
        "authentication.verified",
        "authorization.organization_resolved",
        "retrieval.completed",
        "evidence.assembled",
        "knowledge_request.completed",
        "request.completed"
      ]
    );

    const serializedLogs =
      JSON.stringify(entries);

    assert.equal(
      serializedLogs.includes(
        question
      ),
      false
    );

    assert.equal(
      serializedLogs.includes(
        fixture.knowledge.a
      ),
      false
    );

    assert.equal(
      serializedLogs.includes(
        fixture.knowledge.b
      ),
      false
    );

    assert.equal(
      serializedLogs.includes(
        fixture.users.a.accessToken
      ),
      false
    );
  }
);

test(
  "Legacy GET question transport is unavailable",
  async () => {
    const response =
      await fetch(
        `${application.baseUrl}/ask?question=legacy`,
        {
          headers: {
            Authorization:
              `Bearer ${
                fixture.users.a.accessToken
              }`
          }
        }
      );

    assert.equal(
      response.status,
      404
    );
  }
);

test(
  "POST question transport rejects a missing question",
  async () => {
    const response =
      await fetch(
        `${application.baseUrl}/ask`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${
                fixture.users.a.accessToken
              }`,
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({})
        }
      );

    const body =
      await response.json();

    assert.equal(
      response.status,
      400
    );

    assert.deepEqual(
      body,
      {
        success: false,
        error:
          "Question required"
      }
    );
  }
);
