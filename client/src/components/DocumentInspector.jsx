/******************************************************************************
 * File: DocumentInspector.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays enterprise document metadata independently of conversational
 * retrieval. Provides an inspection-oriented workspace for exploring
 * organizational knowledge outside of conversational search.
 ******************************************************************************/

import { useState } from "react";

function DocumentInspector({
  document,
  documents = [],
  onSelectDocument
}) {
  const [expandedSection, setExpandedSection] = useState(null);

  function toggleSection(id) {
    setExpandedSection((current) =>
      current === id ? null : id
    );
  }

  function openRelatedDocument(title) {
    const related = documents.find(
      (doc) => doc.title === title
    );

    if (related && onSelectDocument) {
      onSelectDocument(related);
    }
  }

  if (!document) {
    return (
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Document Inspector</h2>
            <p>
              Select a document from the Knowledge Library to inspect its
              metadata and organizational relationships.
            </p>
          </div>
        </div>

        <div className="empty-state">
          No document selected.
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Document Inspector</h2>
          <p>
            Enterprise document metadata and structural analysis.
          </p>
        </div>
      </div>

      <div className="evidence-card">

        <div className="document-label">
          DOCUMENT
        </div>

        <h3>{document.title}</h3>

        {/* ==========================================================
            Metadata
        ========================================================== */}

        <div className="evidence-meta">

          <div>
            <span>Department</span>
            <strong>{document.department}</strong>
          </div>

          <div>
            <span>Owner</span>
            <strong>{document.owner}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{document.status}</strong>
          </div>

          <div>
            <span>Revision</span>
            <strong>{document.revision}</strong>
          </div>

          <div>
            <span>Effective Date</span>
            <strong>{document.effectiveDate}</strong>
          </div>

          <div>
            <span>Indexed Sections</span>
            <strong>{document.chunks}</strong>
          </div>

        </div>

        {/* ==========================================================
            Purpose
        ========================================================== */}

        <div className="excerpt-group">

          <h4>Purpose</h4>

          <div className="excerpt-card">
            <p>{document.purpose}</p>
          </div>

        </div>

        {/* ==========================================================
            Document Structure
        ========================================================== */}

        <div className="excerpt-group">

          <h4>Document Structure</h4>

          {!document.sectionHeadings ||
          document.sectionHeadings.length === 0 ? (

            <div className="empty-state">
              No section headings detected.
            </div>

          ) : (

            document.sectionHeadings.map((heading) => (

              <div
                key={heading}
                className="excerpt-card"
              >
                <p>{heading}</p>
              </div>

            ))

          )}

        </div>

        {/* ==========================================================
            Related Documents
        ========================================================== */}

        <div className="excerpt-group">

          <h4>Related Documents</h4>

          {!document.relatedDocuments ||
          document.relatedDocuments.length === 0 ? (

            <div className="empty-state">
              No related documents available.
            </div>

          ) : (

            document.relatedDocuments.map((item) => (

              <button
                key={item}
                type="button"
                className="excerpt-card"
                onClick={() => openRelatedDocument(item)}
              >
                <p>{item}</p>
              </button>

            ))

          )}

        </div>

        {/* ==========================================================
            Indexed Sections
        ========================================================== */}

        <div className="excerpt-group">

          <h4>Indexed Sections</h4>

          {!document.sections ||
          document.sections.length === 0 ? (

            <div className="empty-state">
              No indexed sections available.
            </div>

          ) : (

            document.sections.map((section) => {

              const expanded = expandedSection === section.id;

              return (

                <div
                  key={section.id}
                  className="excerpt-card"
                >

                  <button
                    type="button"
                    className="section-toggle"
                    onClick={() => toggleSection(section.id)}
                  >

                    <strong>
                      {expanded ? "▼" : "▶"} Section {section.sectionNumber}
                    </strong>

                    <span>
                      {section.characterCount} characters
                    </span>

                  </button>

                  {expanded && (

                    <>

                      <p>{section.text}</p>

                      <div className="excerpt-footer">
                        {section.characterCount} characters
                      </div>

                    </>

                  )}

                </div>

              );

            })

          )}

        </div>

      </div>
    </section>
  );
}

export default DocumentInspector;