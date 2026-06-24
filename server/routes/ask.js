const express = require("express");
const router = express.Router();

const openai =
  require("../clients/openai");

const {
  searchKnowledge
} = require("../services/retrievalService");

router.get("/", async (req, res) => {
  try {
    const question = req.query.question;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question parameter required"
      });
    }

    const matches =
      await searchKnowledge(question);

    const context = matches
      .map(
        match =>
          `${match.title}\n${match.chunk_text}`
      )
      .join("\n\n");

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the supplied context. If the answer is not in the context, say you do not know."
          },
          {
            role: "user",
            content: `
Context:

${context}

Question:

${question}
`
          }
        ]
      });

    const answer =
      completion.choices[0].message.content;

    res.json({
      success: true,
      question,
      answer,
      sources: matches.map(match => ({
        id: match.id,
        title: match.title,
        similarity: match.similarity
      }))
    });

  } catch (error) {
    console.error("ASK ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;