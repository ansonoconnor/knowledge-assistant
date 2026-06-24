const openai = require("../clients/openai");

async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return response.data[0].embedding;
}

module.exports = {
  createEmbedding
};