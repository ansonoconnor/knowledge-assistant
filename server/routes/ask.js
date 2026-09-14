const express = require("express");
const router = express.Router();

const openai = require("../clients/openai");

const {
  requireAuthenticatedUser
} = require("../middleware/authenticate");

const {
  searchKnowledge
} = require("../services/retrievalService");

const {
  buildEvidenceSet
} = require("../services/evidenceService");

const {
  buildPrompt
} = require("../prompts/promptAssembler");

router.get(
  "/",
  requireAuthenticatedUser,
  async (req, res) => {
    try {
      const question = req.query.question;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: "Question parameter required"
        });
      }

      const matches =
        await searchKnowledge(
          req.supabase,
          req.organizationId,
          question
        );

      const evidence = buildEvidenceSet(question, matches);

      const messages = buildPrompt(
        evidence.context,
        question
      );

      const completion =
        await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages
        });

      const answer =
        completion.choices[0].message.content;

      res.json({
        success: true,
        question,
        answer,
        evidence
      });

    } catch (error) {
      console.error("ASK ERROR:", error);

      res.status(500).json({
        success: false,
        error: "Unable to process the knowledge request"
      });
    }
  }
);

module.exports = router;