function buildEvidenceSet(question, matches) {
  const grouped = {};

  for (const match of matches) {
    const title = match.title;

    if (!grouped[title]) {
      grouped[title] = {
        id: match.id,
        title,
        highestSimilarity: match.similarity,
        supportingSections: 0,
        excerpts: []
      };
    }

    grouped[title].supportingSections += 1;

    grouped[title].excerpts.push({
      id: match.id,
      similarity: match.similarity,
      text: match.chunk_text
    });

    if (match.similarity > grouped[title].highestSimilarity) {
      grouped[title].highestSimilarity = match.similarity;
    }
  }

  const documents = Object.values(grouped);

  const context = matches
    .map(
      (match) => `Document:
${match.title}

Content:
${match.chunk_text}`
    )
    .join("\n\n");

  return {
    question,
    documents,
    summary: {
      retrievedChunks: matches.length,
      uniqueDocuments: documents.length,
      supportingSections: matches.length
    },
    context
  };
}

module.exports = {
  buildEvidenceSet
};