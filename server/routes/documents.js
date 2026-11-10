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
 * Availability:
 * Only chunks belonging to a database-verified complete document are exposed
 * through the organizational document library.
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
            `
              id,
              title,
              chunk_text,
              chunk_index,
              document_id,
              document:knowledge_documents!inner(
                id,
                source_name,
                status
              )
            `
        )
        .eq(
          "organization_id",
          req.organizationId
        )
          .eq(
            "document.status",
            "complete"
          )
          .order(
            "document_id",
            { ascending: true }
          )
          .order(
            "chunk_index",
            { ascending: true }
          );

      if (error) {
        throw error;
      }

      const groupedDocuments = {};

      data.forEach((row) => {
        const documentId =
          row.document_id;

        const documentTitle =
          row.document.source_name;

        if (!groupedDocuments[documentId]) {
          groupedDocuments[documentId] = {
            id: documentId,
            title: documentTitle,
            chunks: []
          };
        }

        groupedDocuments[documentId].chunks.push(row);
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
          id: document.id,
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
