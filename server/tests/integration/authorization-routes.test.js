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
      prefix: "ROUTE"
    });

  application =
    await startApplication();
});

after(async () => {
  await application.stop();
  await fixture.cleanup();
});

async function requestDocuments(
  accessToken
) {
  const response =
    await fetch(
      `${application.baseUrl}/documents`,
      {
        headers:
          accessToken
            ? {
                Authorization:
                  `Bearer ${accessToken}`
              }
            : {}
      }
    );

  return {
    status: response.status,
    body: await response.json()
  };
}

test(
  "Anonymous request is denied before document access",
  async () => {
    const response =
      await requestDocuments();

    assert.equal(
      response.status,
      401
    );

    assert.equal(
      response.body.success,
      false
    );
  }
);

test(
  "Authenticated user without membership is denied",
  async () => {
    const response =
      await requestDocuments(
        fixture.users.noMembership
          .accessToken
      );

    assert.equal(
      response.status,
      403
    );

    assert.equal(
      response.body.success,
      false
    );
  }
);

test(
  "User A document route includes A and excludes B",
  async () => {
    const response =
      await requestDocuments(
        fixture.users.a.accessToken
      );

    const serialized =
      JSON.stringify(response.body);

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      serialized.includes(
        fixture.titles.a
      ),
      true
    );

    assert.equal(
      serialized.includes(
        fixture.titles.b
      ),
      false
    );
  }
);

test(
  "User B document route includes B and excludes A",
  async () => {
    const response =
      await requestDocuments(
        fixture.users.b.accessToken
      );

    const serialized =
      JSON.stringify(response.body);

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      serialized.includes(
        fixture.titles.b
      ),
      true
    );

    assert.equal(
      serialized.includes(
        fixture.titles.a
      ),
      false
    );
  }
);
