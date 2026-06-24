const express = require("express");
const supabase = require("../clients/supabase");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select("title");

    if (error) {
      throw error;
    }

    const documents = {};

    data.forEach(row => {
      if (!documents[row.title]) {
        documents[row.title] = 0;
      }

      documents[row.title]++;
    });

    const result = Object.entries(documents).map(
      ([title, chunks]) => ({
        title,
        chunks
      })
    );

    res.json({
      success: true,
      documents: result
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