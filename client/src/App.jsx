/******************************************************************************
 * File: App.jsx
 * Layer: Application
 * Responsibility:
 * Coordinates the Knowledge Assistant workspace by orchestrating document
 * upload, retrieval, evidence presentation, and document inspection.
 ******************************************************************************/

import { useState, useEffect } from "react";
import "./App.css";

import UploadPanel from "./components/UploadPanel";
import KnowledgeLibrary from "./components/KnowledgeLibrary";
import DocumentInspector from "./components/DocumentInspector";
import QuestionPanel from "./components/QuestionPanel";
import AnswerPanel from "./components/AnswerPanel";
import EvidencePanel from "./components/EvidencePanel";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);

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

        if (!selectedDocument && data.documents.length > 0) {
          setSelectedDocument(data.documents[0]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  function selectDocument(document) {
    setSelectedDocument(document);
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

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="eyebrow">
          Enterprise Knowledge Infrastructure
        </div>

        <h1>Knowledge Assistant</h1>

        <p>
          Grounded answers backed by retrieved organizational evidence,
          supporting excerpts, and transparent source context.
        </p>
      </header>

      <main className="workspace">
        <UploadPanel
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          uploadPdf={uploadPdf}
          uploadMessage={uploadMessage}
        />

        <div
          className={`workspace-grid ${
            libraryCollapsed ? "library-is-collapsed" : ""
          }`}
        >
          <KnowledgeLibrary
            documents={documents}
            selectedDocument={selectedDocument}
            onSelectDocument={selectDocument}
            collapsed={libraryCollapsed}
            onToggleCollapsed={() =>
              setLibraryCollapsed((current) => !current)
            }
          />

          <div className="workspace-primary">
            <DocumentInspector
              document={selectedDocument}
              documents={documents}
              onSelectDocument={selectDocument}
            />

            <QuestionPanel
              question={question}
              setQuestion={setQuestion}
              askQuestion={askQuestion}
              loading={loading}
            />

            <AnswerPanel
              answer={answer}
            />
          </div>

          <div className="workspace-secondary">
            <EvidencePanel
              evidence={evidence}
              documents={documents}
              onSelectDocument={selectDocument}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;