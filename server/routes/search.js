const express = require("express");
const router = express.Router();

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

    res.json({
      success: true,
      question,
      matchCount: matches.length,
      matches
    });

  } catch (error) {
    console.error("SEARCH ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;