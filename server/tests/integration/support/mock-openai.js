const openai =
  require(
    "../../../clients/openai"
  );

function createSharedQueryEmbedding() {
  const embedding =
    new Array(1536).fill(0);

  /*
   * Both organization vectors exceed the retrieval threshold.
   * Authorization, rather than semantic irrelevance, must exclude
   * the other organization's chunk.
   */
  embedding[0] = 1;
  embedding[1] = 1;

  return embedding;
}

openai.embeddings.create =
  async () => ({
    data: [
      {
        embedding:
          createSharedQueryEmbedding()
      }
    ]
  });

openai.chat.completions.create =
  async ({
    messages
  }) => ({
    choices: [
      {
        message: {
          /*
           * Echo the exact model messages so the integration test can
           * inspect the context without calling an external model.
           */
          content:
            JSON.stringify(messages)
        }
      }
    ]
  });
