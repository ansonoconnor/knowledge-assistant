const pdf = require("pdf-parse");
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
console.log("PDF PARSE:");
console.log(pdfParse);
const fs = require("fs");

const {
  ingestDocument
} = require("../services/ingestionService");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/upload",
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No PDF uploaded"
        });
      }

      const dataBuffer =
        fs.readFileSync(req.file.path);

      const pdfData =
        await pdf(dataBuffer);

      const text =
        pdfData.text.trim();

      if (!text) {
        return res.status(400).json({
          success: false,
          error:
            "Could not extract text from PDF"
        });
      }

      const chunks = [];

      const chunkSize = 1000;

      for (
        let i = 0;
        i < text.length;
        i += chunkSize
      ) {
        chunks.push(
          text.substring(
            i,
            i + chunkSize
          )
        );
      }

      const results = [];

      for (
        let i = 0;
        i < chunks.length;
        i++
      ) {
        const result =
          await ingestDocument(
            `${req.file.originalname} - Part ${i + 1}`,
            chunks[i]
          );

        results.push(result);
      }

      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        filename:
          req.file.originalname,
        chunksCreated:
          results.length,
        documents: results
      });

    } catch (error) {
      console.error(
        "PDF UPLOAD ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;