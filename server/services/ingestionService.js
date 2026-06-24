const supabase = require("../clients/supabase");
const { createEmbedding } = require("./embeddingService");

async function ingestDocument(title, content) {
  const embedding =
    await createEmbedding(content);

  const { data, error } = await supabase
    .from("knowledge_chunks")
    .insert([
      {
        title,
        chunk_text: content,
        embedding
      }
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  ingestDocument
};