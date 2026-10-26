const express =
  require("express");

const router =
  express.Router();

const openai =
  require("../clients/openai");

const {
  requireAuthenticatedUser
} = require(
  "../middleware/authenticate"
);

const {
  searchKnowledge
} = require(
  "../services/retrievalService"
);

const {
  buildEvidenceSet
} = require(
  "../services/evidenceService"
);

const {
  buildPrompt
} = require(
  "../prompts/promptAssembler"
);

const {
  info,
  error: logError
} = require(
  "../utils/logger"
);

router.post(
  "/",
  requireAuthenticatedUser,
  async (
    req,
    res
  ) => {
    try {
      const question =
        typeof req.body?.question ===
        "string"
          ? req.body.question.trim()
          : "";

      if (!question) {
        info(
          "knowledge_request.denied",
          {
            requestId:
              req.requestId,
            userId:
              req.user.id,
            organizationId:
              req.organizationId,
            reason:
              "question_required",
            statusCode:
              400
          }
        );

        return res.status(400).json({
          success: false,
          error:
            "Question required"
        });
      }

      const matches =
        await searchKnowledge(
          req.supabase,
          req.organizationId,
          question
        );

      info(
        "retrieval.completed",
        {
          requestId:
            req.requestId,
          userId:
            req.user.id,
          organizationId:
            req.organizationId,
          retrievedChunks:
            matches.length
        }
      );

      const evidence =
        buildEvidenceSet(
          question,
          matches
        );

      info(
        "evidence.assembled",
        {
          requestId:
            req.requestId,
          userId:
            req.user.id,
          organizationId:
            req.organizationId,
          retrievedChunks:
            evidence.summary
              .retrievedChunks,
          uniqueDocuments:
            evidence.summary
              .uniqueDocuments
        }
      );

      const messages =
        buildPrompt(
          evidence.context,
          question
        );

      const completion =
        await openai
          .chat
          .completions
          .create({
            model:
              "gpt-4.1-mini",
            messages
          });

      const answer =
        completion
          .choices[0]
          .message
          .content;

      info(
        "knowledge_request.completed",
        {
          requestId:
            req.requestId,
          userId:
            req.user.id,
          organizationId:
            req.organizationId
        }
      );

      res.json({
        success: true,
        question,
        answer,
        evidence
      });

    } catch (error) {
      logError(
        "knowledge_request.failed",
        error,
        {
          requestId:
            req.requestId,
          userId:
            req.user?.id ||
            null,
          organizationId:
            req.organizationId ||
            null
        }
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to process the knowledge request"
      });
    }
  }
);

module.exports = router;
