/******************************************************************************
 * File: documents.js
 * Layer: API Route
 * Responsibility:
 * Returns the organization's indexed document catalog with extracted metadata,
 * document sections, and relationship data for browsing and inspection.
 *
 * Security:
 * Access requires an authenticated Supabase user. Authentication is enforced
 * before the route uses the request-scoped Supabase client. PostgreSQL RLS
 * and the explicit organization predicate constrain the returned knowledge.
 *
 * Notes:
 * Chunks belonging to the same source PDF are grouped into a single logical
 * enterprise document by removing the " - Part X" suffix generated during
 * indexing.
 ******************************************************************************/

const express = require("express");

const {
  requireAuthenticatedUser
} = require("../middleware/authenticate");

const {
  extractDocumentMetadata,
  extractDocumentSections
} = require("../services/documentMetadataService");

const {
  getRelatedDocuments
} = require("../services/knowledgeRelationshipService");

const router = express.Router();

/******************************************************************************
 * Helpers
 ******************************************************************************/

function normalizeDocumentTitle(title = "") {
  return title.replace(/\s+-\s+Part\s+\d+$/i, "").trim();
}

/******************************************************************************
 * Routes
 ******************************************************************************/

router.get(
  "/",
  requireAuthenticatedUser,
  async (req, res) => {
    try {
      const { data, error } =
        await req.supabase
        .from("knowledge_chunks")
        .select(
          "id, title, chunk_text"
        )
        .eq(
          "organization_id",
          req.organizationId
        )
        .order("title", { ascending: true })
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      const groupedDocuments = {};

      data.forEach((row) => {
        const documentTitle = normalizeDocumentTitle(row.title);

        if (!groupedDocuments[documentTitle]) {
          groupedDocuments[documentTitle] = {
            title: documentTitle,
            chunks: []
          };
        }

        groupedDocuments[documentTitle].chunks.push(row);
      });

      const documents = Object.values(groupedDocuments).map((document) => {
        const combinedText = document.chunks
          .map((chunk) => chunk.chunk_text || "")
          .join("\n\n");

        const metadata = extractDocumentMetadata({
          title: document.title,
          chunkText: combinedText,
          chunkCount: document.chunks.length
        });

        return {
          title: document.title,

          chunks: document.chunks.length,

          department: metadata.department,
          owner: metadata.owner,
          status: metadata.status,
          revision: metadata.revision,
          effectiveDate: metadata.effectiveDate,
          purpose: metadata.purpose,

          relatedPolicies: metadata.relatedPolicies,
          sectionHeadings: metadata.sectionHeadings,

          sections: extractDocumentSections(document.chunks),

          relatedDocuments: getRelatedDocuments(document.title)
        };
      });

      documents.sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      res.json({
        success: true,
        documents
      });

    } catch (error) {
      console.error("DOCUMENTS ERROR:", error);

      res.status(500).json({
        success: false,
        error: "Unable to retrieve the document library"
      });
    }
  }
);

module.exports = router;