/******************************************************************************
 * File: KnowledgeLibrary.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays the organization's indexed document catalog, supports live
 * searching, groups documents by department, and allows users to select
 * documents for inspection.
 ******************************************************************************/

import { useMemo, useState } from "react";

function displayDocumentTitle(title = "") {
  return title
    .replace(/\s-\sPart\s\d+$/i, "")
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ");
}

function KnowledgeLibrary({
  documents,
  selectedDocument,
  onSelectDocument,
  collapsed,
  onToggleCollapsed
}) {
  const [searchText, setSearchText] = useState("");

  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return documents;

    return documents.filter((doc) => (
      displayDocumentTitle(doc.title).toLowerCase().includes(query) ||
      doc.department.toLowerCase().includes(query) ||
      doc.owner.toLowerCase().includes(query)
    ));
  }, [documents, searchText]);

  const groupedDocuments = useMemo(() => {
    const groups = {};

    filteredDocuments.forEach((doc) => {
      const department = doc.department || "General";
      if (!groups[department]) groups[department] = [];
      groups[department].push(doc);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredDocuments]);

  return (
    <section className={`card knowledge-library ${collapsed ? "collapsed" : ""}`}>
      <button
        className="library-collapse-button"
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand Knowledge Library" : "Collapse Knowledge Library"}
        title={collapsed ? "Expand Knowledge Library" : "Collapse Knowledge Library"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <div className="collapsed-library-label">
          <span>Knowledge Library</span>
        </div>
      ) : (
        <>
          <div className="card-header">
            <div>
              <h2>Knowledge Library</h2>
              <p>
                Browse and inspect organizational knowledge independently of
                conversational search.
              </p>
            </div>

            <span className="pill">
              {filteredDocuments.length} / {documents.length}
            </span>
          </div>

          <input
            className="library-search"
            type="text"
            placeholder="Search documents, departments, or owners..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {filteredDocuments.length === 0 && (
            <div className="empty-state">
              No documents match your search.
            </div>
          )}

          {groupedDocuments.map(([department, docs]) => (
            <div key={department} className="department-group">
              <div className="department-header">
                <h3>{department}</h3>
                <span className="pill">{docs.length}</span>
              </div>

              {docs.map((doc) => (
                <div
                  key={doc.title}
                  className={`library-item ${
                    selectedDocument?.title === doc.title ? "selected" : ""
                  }`}
                  onClick={() => onSelectDocument(doc)}
                >
                  <div>
                    <strong>{displayDocumentTitle(doc.title)}</strong>

                    <span>Owner: {doc.owner}</span>

                    <span>
                      {doc.chunks} indexed section
                      {doc.chunks === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="pill">
                    Inspect →
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </section>
  );
}

export default KnowledgeLibrary;