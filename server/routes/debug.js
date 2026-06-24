const express = require("express");
const router = express.Router();

const openai =
  require("../clients/openai");

router.get("/env", (req, res) => {
  const key = process.env.OPENAI_API_KEY;

  res.json({
    exists: !!key,
    length: key ? key.length : 0,
    prefix: key
      ? key.substring(0, 10)
      : null
  });
});

router.get("/key", (req, res) => {
  const key = process.env.OPENAI_API_KEY;

  res.json({
    exists: !!key,
    length: key ? key.length : 0,
    startsWith: key
      ? key.substring(0, 20)
      : null,
    endsWith: key
      ? key.substring(key.length - 10)
      : null
  });
});

router.get("/openai", (req, res) => {
  try {
    res.json({
      type: typeof openai,
      hasEmbeddings: !!openai.embeddings,
      topLevelKeys: Object.keys(openai)
    });
  } catch (error) {
    res.json({
      error: error.message
    });
  }
});

module.exports = router;