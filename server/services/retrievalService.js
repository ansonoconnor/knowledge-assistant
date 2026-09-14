const { createEmbedding } = require("./embeddingService");

async function searchKnowledge(
  supabase,
  organizationId,
  question
) {
  const queryEmbedding =
    await createEmbedding(question);

  const { data, error } =
    await supabase.rpc(
      "match_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        target_organization_id:
          organizationId
      }
    );

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  searchKnowledge
};