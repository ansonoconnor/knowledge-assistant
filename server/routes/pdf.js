/******************************************************************************
 * File: pdf.js
 * Layer: API Route
 * Responsibility:
 * Accepts authenticated PDF uploads, validates basic upload constraints,
 * extracts text, divides the document into searchable chunks, and sends those
 * chunks through the ingestion pipeline.
 *
 * Security:
 * Authentication is enforced before Multer accepts the uploaded file or any
 * PDF parsing, embedding generation, or database persistence occurs.
 *
 * Resource lifecycle:
 * Any temporary file created by Multer is removed after processing, whether
 * the request succeeds or fails.
 ******************************************************************************/

const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const express = require("express");
const multer = require("multer");

const {
  requireAuthenticatedUser
} = require("../middleware/authenticate");

const {
  ingestDocument
} = require("../services/ingestionService");

const router = express.Router();

const MAX_PDF_SIZE_BYTES =
  10 * 1024 * 1024;

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: MAX_PDF_SIZE_BYTES
  },
  fileFilter: (
    req,
    file,
    callback
  ) => {
    const extension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const isPdfExtension =
      extension === ".pdf";

    const isPdfMimeType =
      file.mimetype === "application/pdf";

    if (
      !isPdfExtension ||
      !isPdfMimeType
    ) {
      return callback(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "pdf"
        )
      );
    }

    callback(null, true);
  }
});

function removeTemporaryFile(
  filePath
) {
  if (!filePath) {
    return;
  }

  try {
    if (
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "PDF CLEANUP ERROR:",
      error
    );
  }
}

router.post(
  "/upload",

  /*
   * Authentication intentionally comes before Multer.
   *
   * An unauthenticated caller should be rejected before the application
   * accepts a file or performs any downstream processing.
   */
  requireAuthenticatedUser,

  (req, res, next) => {
    upload.single("pdf")(
      req,
      res,
      (error) => {
        if (!error) {
          return next();
        }

        console.error(
          "PDF UPLOAD VALIDATION ERROR:",
          error
        );

        if (
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
        ) {
          return res.status(400).json({
            success: false,
            error:
              "PDF must be 10 MB or smaller"
          });
        }

        return res.status(400).json({
          success: false,
          error:
            "A valid PDF file is required"
        });
      }
    );
  },

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No PDF uploaded"
        });
      }

      const dataBuffer =
        fs.readFileSync(
          req.file.path
        );

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
        error:
          "Unable to process the PDF upload"
      });

    } finally {
      removeTemporaryFile(
        req.file?.path
      );
    }
  }
);

module.exports = router;