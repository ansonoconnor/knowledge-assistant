import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
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
      const response = await fetch(
        `${API_BASE}/documents`
      );

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

    try {
      const response = await fetch(
        `${API_BASE}/ask?question=${encodeURIComponent(
          question
        )}`
      );

      const data = await response.json();

      setAnswer(data.answer || "");
      setSources(data.sources || []);
    } catch (error) {
      console.error(error);
      setAnswer("Error contacting server.");
    }

    setLoading(false);
  }

  async function uploadPdf() {
    if (!pdfFile) return;

    const formData = new FormData();

    formData.append("pdf", pdfFile);

    try {
      const response = await fetch(
        `${API_BASE}/pdf/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (data.success) {
        setUploadMessage(
          `Uploaded successfully. Created ${data.chunksCreated} chunks.`
        );

        await loadDocuments();
      } else {
        setUploadMessage(
          data.error || "Upload failed."
        );
      }
    } catch (error) {
      console.error(error);

      setUploadMessage(
        "Upload failed."
      );
    }
  }

  return (
    <div className="container">
      <h1>Knowledge Assistant</h1>

      <div className="card">
        <h2>Upload PDF</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setPdfFile(e.target.files[0])
          }
        />

        <button onClick={uploadPdf}>
          Upload PDF
        </button>

        {uploadMessage && (
          <p>{uploadMessage}</p>
        )}
      </div>

      <div className="card">
        <h2>Knowledge Library</h2>

        {documents.length === 0 && (
          <p>No documents loaded.</p>
        )}

        {documents.map((doc, index) => (
          <div
            key={index}
            className="source"
          >
            <strong>{doc.title}</strong>

            <div>
              Chunks: {doc.chunks}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Ask a Question</h2>

        <textarea
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          placeholder="Ask something..."
        />

        <button
          onClick={askQuestion}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      <div className="card">
        <h2>Answer</h2>

        <div className="answer">
          {answer || "No answer yet."}
        </div>
      </div>

      <div className="card">
        <h2>Sources</h2>

        {sources.length === 0 && (
          <p>No sources yet.</p>
        )}

        {sources.map((source, index) => (
          <div
            key={index}
            className="source"
          >
            <strong>
              {source.title}
            </strong>

            <div>
              Similarity:{" "}
              {source.similarity?.toFixed(
                3
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;