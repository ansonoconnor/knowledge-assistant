const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const net = require("node:net");
const path = require("node:path");
const { once } = require("node:events");
const { spawn } = require("node:child_process");
const { createClient } = require("@supabase/supabase-js");

const {
  API_URL,
  ANON_KEY,
  SERVICE_ROLE_KEY
} = process.env;

if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Local Supabase environment variables are required"
  );
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
};

const organizations = {
  a: "org-momentum-co",
  b: "org-isolation-b"
};

function createEmbedding(firstValue, secondValue) {
  const embedding = new Array(1536).fill(0);

  embedding[0] = firstValue;
  embedding[1] = secondValue;

  return embedding;
}

async function createAuthorizationFixture({
  prefix,
  includeNoMembership = true
}) {
  const runId = crypto.randomUUID();
  const password = `Authorization-${runId}!Aa1`;

  const titles = {
    a: `${prefix}_A_SENTINEL_${runId}`,
    b: `${prefix}_B_SENTINEL_${runId}`
  };

  const knowledge = {
    a: `${prefix}_A_KNOWLEDGE_${runId}`,
    b: `${prefix}_B_KNOWLEDGE_${runId}`
  };

  const embeddings = {
    a: createEmbedding(1, 0),
    b: createEmbedding(0, 1)
  };

  const admin = createClient(
    API_URL,
    SERVICE_ROLE_KEY,
    clientOptions
  );

  const users = {};

  async function createUser(label, organizationId) {
    const email =
      `${prefix.toLowerCase()}-${label}-${runId}@example.test`;

    const {
      data,
      error
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    assert.equal(error, null, error?.message);

    if (organizationId) {
      const {
        error: membershipError
      } = await admin
        .from("organization_memberships")
        .insert({
          organization_id: organizationId,
          user_id: data.user.id,
          role: "member"
        });

      assert.equal(
        membershipError,
        null,
        membershipError?.message
      );
    }

    const client = createClient(
      API_URL,
      ANON_KEY,
      clientOptions
    );

    const {
      data: signInData,
      error: signInError
    } = await client.auth.signInWithPassword({
      email,
      password
    });

    assert.equal(
      signInError,
      null,
      signInError?.message
    );

    users[label] = {
      id: data.user.id,
      client,
      accessToken:
        signInData.session.access_token
    };
  }

  await createUser("a", organizations.a);
  await createUser("b", organizations.b);

  if (includeNoMembership) {
    await createUser(
      "noMembership",
      null
    );
  }

  const {
    error: chunkError
  } = await admin
    .from("knowledge_chunks")
    .insert([
      {
        title: titles.a,
        chunk_text: knowledge.a,
        organization_id: organizations.a,
        embedding: embeddings.a
      },
      {
        title: titles.b,
        chunk_text: knowledge.b,
        organization_id: organizations.b,
        embedding: embeddings.b
      }
    ]);

  assert.equal(
    chunkError,
    null,
    chunkError?.message
  );

  async function retrieve(
    client,
    organizationId,
    queryEmbedding
  ) {
    const {
      data,
      error
    } = await client.rpc(
      "match_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        target_organization_id:
          organizationId
      }
    );

    assert.equal(error, null, error?.message);

    return data;
  }

  async function cleanup() {
    await admin
      .from("knowledge_chunks")
      .delete()
      .or(
        `title.in.(${Object.values(titles).join(",")}),` +
        `title.like.INSERT_%_${runId},` +
        `title.like.CROSS_%_${runId}`
      );

    for (const user of Object.values(users)) {
      await admin.auth.admin.deleteUser(
        user.id
      );
    }
  }

  return {
    runId,
    admin,
    users,
    titles,
    knowledge,
    embeddings,
    organizations,
    retrieve,
    cleanup
  };
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();

      server.close(() => resolve(port));
    });
  });
}

async function startApplication({
  mockOpenAI = false
} = {}) {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const serverDirectory =
    path.resolve(__dirname, "../../..");

  const args = [];

  if (mockOpenAI) {
    args.push(
      "--require",
      path.resolve(
        __dirname,
        "mock-openai.js"
      )
    );
  }

  args.push("app.js");

  let output = "";

  const processHandle = spawn(
    process.execPath,
    args,
    {
      cwd: serverDirectory,
      env: {
        ...process.env,
        PORT: String(port),
        SUPABASE_URL: API_URL,
        SUPABASE_ANON_KEY: ANON_KEY,
        OPENAI_API_KEY:
          "local-integration-test-key"
      },
      stdio: [
        "ignore",
        "pipe",
        "pipe"
      ]
    }
  );

  processHandle.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });

  processHandle.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response =
        await fetch(`${baseUrl}/health`);

      if (response.ok) {
        return {
          baseUrl,
          getOutput() {
            return output;
          },
          async stop() {
            if (processHandle.exitCode !== null) {
              return;
            }

            processHandle.kill("SIGTERM");

            await Promise.race([
              once(processHandle, "exit"),
              new Promise((resolve) =>
                setTimeout(resolve, 2000)
              )
            ]);
          }
        };
      }
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );
  }

  processHandle.kill("SIGTERM");

  throw new Error(
    `Express server did not become healthy:\n${output}`
  );
}

module.exports = {
  createAuthorizationFixture,
  createEmbedding,
  startApplication
};
