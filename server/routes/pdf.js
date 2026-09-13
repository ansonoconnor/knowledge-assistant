/******************************************************************************
 * File: pdf.js
 * Layer: API Route
 * Responsibility:
 * Accepts authenticated PDF uploads, extracts text, divides the document into
 * searchable chunks, and sends those chunks through the ingestion pipeline.
 *
 * Security:
 * Authentication is enforced before Multer accepts the uploaded file or any
 * PDF parsing, embedding generation, or database persistence occurs.
 ******************************************************************************/

const pdf = require("pdf-parse");
const express = require("express");
const multer = require("multer");
const fs = require("fs");

const {
  requireAuthenticatedUser
} = require("../middleware/authenticate");

const {
  ingestDocument
} = require("../services/ingestionService");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

/******************************************************************************
 * Routes
 ******************************************************************************/

router.post(
  "/upload",

  /*
   * Authentication intentionally comes before Multer.
   *
   * An unauthenticated caller should be rejected before the application
   * accepts a file or performs any downstream processing.
   */
  requireAuthenticatedUser,

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
        error: "Unable to process the PDF upload"
      });
    }
  }
);

module.exports = router;