const express = require("express");

const {
  ingestDocument
} = require("../services/ingestionService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "title and content required"
      });
    }

    const result =
      await ingestDocument(
        title,
        content
      );

    res.json({
      success: true,
      document: result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;