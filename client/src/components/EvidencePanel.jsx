/******************************************************************************
 * File: EvidencePanel.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays the evidence supporting conversational responses and allows
 * users to navigate directly into the Document Inspector.
 ******************************************************************************/

function EvidencePanel({
  evidence,
  documents = [],
  onSelectDocument
}) {
  const evidenceDocuments = evidence?.documents || [];
  const evidenceSummary = evidence?.summary || null;

  function openDocument(title) {
    const document = documents.find(
      (doc) => doc.title === title
    );

    if (document && onSelectDocument) {
      onSelectDocument(document);
    }
  }

  return (
    <section className="card evidence-section">

      <div className="card-header">
        <div>
          <h2>Evidence</h2>
          <p>
            Supporting documents and excerpts used to construct the answer.
          </p>
        </div>
      </div>

      {!evidence && (
        <div className="empty-state">
          Supporting evidence will appear after a question is answered.
        </div>
      )}

      {evidence && evidenceDocuments.length === 0 && (
        <div className="empty-state">
          No supporting documentation was retrieved.
        </div>
      )}

      {evidenceSummary && evidenceDocuments.length > 0 && (

        <div className="metrics-grid">

          <div className="metric-card">
            <span>Documents</span>
            <strong>{evidenceSummary.uniqueDocuments}</strong>
          </div>

          <div className="metric-card">
            <span>Supporting Sections</span>
            <strong>{evidenceSummary.supportingSections}</strong>
          </div>

          <div className="metric-card">
            <span>Retrieved Chunks</span>
            <strong>{evidenceSummary.retrievedChunks}</strong>
          </div>

        </div>

      )}

      <div className="evidence-list">

        {evidenceDocuments.map((doc) => (

          <article
            key={doc.title}
            className="evidence-card"
          >

            <div className="evidence-card-header">

              <div>

                <div className="document-label">
                  Source Document
                </div>

                <button
                  type="button"
                  className="document-link"
                  onClick={() => openDocument(doc.title)}
                >
                  📄 {doc.title}
                </button>

              </div>

              <div className="relevance-badge">
                <span>Relevance</span>
                <strong>
                  {doc.highestSimilarity?.toFixed(3)}
                </strong>
              </div>

            </div>

            <div className="evidence-meta">

              <div>
                <span>Supporting Sections</span>
                <strong>{doc.supportingSections}</strong>
              </div>

            </div>

            <div className="excerpt-group">

              <h4>Supporting Evidence</h4>

              {doc.excerpts.map((excerpt, index) => (

                <div
                  key={index}
                  className="excerpt-card"
                >

                  <div className="excerpt-label">
                    Supporting Excerpt
                  </div>

                  <p>
                    {excerpt.text.length > 300
                      ? `${excerpt.text.substring(0, 300)}...`
                      : excerpt.text}
                  </p>

                  <div className="excerpt-footer">
                    Section Similarity:{" "}
                    {excerpt.similarity?.toFixed(3)}
                  </div>

                </div>

              ))}

            </div>

          </article>

        ))}

      </div>

    </section>
  );
}

export default EvidencePanel;