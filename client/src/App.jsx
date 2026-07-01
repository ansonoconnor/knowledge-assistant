import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const API_BASE = "http://localhost:5001";

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const response = await fetch(`${API_BASE}/documents`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function askQuestion() {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    setEvidence(null);

    try {
      const response = await fetch(
        `${API_BASE}/ask?question=${encodeURIComponent(question)}`
      );

      const data = await response.json();

      setAnswer(data.answer || "");
      setEvidence(data.evidence || null);
    } catch (error) {
      console.error(error);
      setAnswer("Error contacting server.");
    }

    setLoading(false);
  }

  async function uploadPdf() {
    if (!pdfFile) return;

    setUploadMessage("Indexing document...");

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const response = await fetch(`${API_BASE}/pdf/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadMessage(
          `Document indexed successfully. ${data.chunksCreated} searchable sections created.`
        );

        await loadDocuments();
      } else {
        setUploadMessage(data.error || "Upload failed.");
      }
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed.");
    }
  }

  const evidenceDocuments = evidence?.documents || [];
  const evidenceSummary = evidence?.summary || null;

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="eyebrow">Enterprise Knowledge Infrastructure</div>
        <h1>Knowledge Assistant</h1>
        <p>
          Grounded answers backed by retrieved organizational evidence,
          supporting excerpts, and transparent source context.
        </p>
      </header>

      <main className="workspace">
        <section className="card">
          <div className="card-header">
            <div>
              <h2>Upload PDF</h2>
              <p>Index internal documentation for semantic retrieval.</p>
            </div>
          </div>

          <div className="upload-row">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />

            <button onClick={uploadPdf} disabled={!pdfFile}>
              Upload PDF
            </button>
          </div>

          {uploadMessage && (
            <div className="status-message">
              {uploadMessage}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Knowledge Library</h2>
              <p>Documents currently available for grounded retrieval.</p>
            </div>

            <span className="pill">
              {documents.length} document{documents.length === 1 ? "" : "s"}
            </span>
          </div>

          {documents.length === 0 && (
            <div className="empty-state">
              No documents indexed yet. Upload a PDF to begin building the
              knowledge library.
            </div>
          )}

          {documents.map((doc, index) => (
            <div key={index} className="library-item">
              <div>
                <strong>{doc.title}</strong>
                <span>{doc.chunks} indexed section{doc.chunks === 1 ? "" : "s"}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Ask a Question</h2>
              <p>Query the indexed knowledge base for a grounded response.</p>
            </div>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your uploaded documentation..."
          />

          <button onClick={askQuestion} disabled={loading || !question.trim()}>
            {loading ? "Searching organizational knowledge..." : "Generate Answer"}
          </button>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Answer</h2>
              <p>Grounded response generated from retrieved documentation.</p>
            </div>
          </div>

          <div className={answer ? "answer" : "empty-state"}>
            {answer ||
              "Ask a question about your organization’s documentation. Grounded responses will appear here."}
          </div>
        </section>

        <section className="card evidence-section">
          <div className="card-header">
            <div>
              <h2>Evidence</h2>
              <p>Supporting documents and excerpts used to construct the answer.</p>
            </div>
          </div>

          {!evidence && (
            <div className="empty-state">
              Supporting evidence will appear after a question is answered.
            </div>
          )}

          {evidence && evidenceDocuments.length === 0 && (
            <div className="empty-state">
              No supporting documentation was retrieved for this question.
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
            {evidenceDocuments.map((doc, index) => (
              <article key={index} className="evidence-card">
                <div className="evidence-card-header">
                  <div>
                    <div className="document-label">Source Document</div>
                    <h3>📄 {doc.title}</h3>
                  </div>

                  <div className="relevance-badge">
                    <span>Relevance</span>
                    <strong>{doc.highestSimilarity?.toFixed(3)}</strong>
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

                  {doc.excerpts.map((excerpt, excerptIndex) => (
                    <div key={excerptIndex} className="excerpt-card">
                      <div className="excerpt-label">Supporting Excerpt</div>

                      <p>
                        {excerpt.text.length > 300
                          ? excerpt.text.substring(0, 300) + "..."
                          : excerpt.text}
                      </p>

                      <div className="excerpt-footer">
                        Section Similarity: {excerpt.similarity?.toFixed(3)}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;