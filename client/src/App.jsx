/******************************************************************************
 * File: App.jsx
 * Layer: Application
 * Responsibility:
 * Coordinates authentication, document upload, retrieval, evidence
 * presentation, and document inspection for the Knowledge Assistant workspace.
 *
 * Security:
 * Privileged API requests include the authenticated Supabase access token.
 * The Express API remains responsible for verifying that token before
 * privileged work is performed.
 ******************************************************************************/

import { useState, useEffect } from "react";
import "./App.css";

import supabase from "./lib/supabase";

import AuthPanel from "./components/AuthPanel";
import UploadPanel from "./components/UploadPanel";
import KnowledgeLibrary from "./components/KnowledgeLibrary";
import DocumentInspector from "./components/DocumentInspector";
import QuestionPanel from "./components/QuestionPanel";
import AnswerPanel from "./components/AnswerPanel";
import EvidencePanel from "./components/EvidencePanel";

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5001";

  /******************************************************************************
   * Authentication lifecycle
   ******************************************************************************/

  useEffect(() => {
    let mounted = true;

    async function initializeAuthentication() {
      const {
        data,
        error
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "SESSION INITIALIZATION ERROR:",
          error
        );
      }

      if (mounted) {
        setSession(
          data?.session || null
        );

        setAuthLoading(false);
      }
    }

    initializeAuthentication();

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  /******************************************************************************
   * Authenticated workspace lifecycle
   ******************************************************************************/

  useEffect(() => {
    if (session?.access_token) {
      loadDocuments(
        session.access_token
      );
    } else {
      setDocuments([]);
      setSelectedDocument(null);
      setAnswer("");
      setEvidence(null);
      setUploadMessage("");
    }
  }, [session]);

  /******************************************************************************
   * API helpers
   ******************************************************************************/

  function buildAuthorizationHeaders(
    accessToken
  ) {
    return {
      Authorization:
        `Bearer ${accessToken}`
    };
  }

  async function loadDocuments(
    accessToken = session?.access_token
  ) {
    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/documents`,
        {
          headers:
            buildAuthorizationHeaders(
              accessToken
            )
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to load documents"
        );
      }

      if (data.success) {
        setDocuments(
          data.documents
        );

        setSelectedDocument(
          (currentDocument) => {
            if (currentDocument) {
              const stillExists =
                data.documents.find(
                  (document) =>
                    document.title ===
                    currentDocument.title
                );

              if (stillExists) {
                return stillExists;
              }
            }

            return (
              data.documents[0] ||
              null
            );
          }
        );
      }

    } catch (error) {
      console.error(
        "DOCUMENT LOAD ERROR:",
        error
      );
    }
  }

  function selectDocument(document) {
    setSelectedDocument(document);
  }

  async function askQuestion() {
    if (
      !question.trim() ||
      !session?.access_token
    ) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setEvidence(null);

    try {
      const response = await fetch(
        `${API_BASE}/ask?question=${encodeURIComponent(
          question
        )}`,
        {
          headers:
            buildAuthorizationHeaders(
              session.access_token
            )
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to answer question"
        );
      }

      setAnswer(
        data.answer || ""
      );

      setEvidence(
        data.evidence || null
      );

    } catch (error) {
      console.error(
        "QUESTION ERROR:",
        error
      );

      setAnswer(
        error.message ||
        "Error contacting server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadPdf() {
    if (
      !pdfFile ||
      !session?.access_token
    ) {
      return;
    }

    setUploadMessage(
      "Indexing document..."
    );

    const formData =
      new FormData();

    formData.append(
      "pdf",
      pdfFile
    );

    try {
      const response = await fetch(
        `${API_BASE}/pdf/upload`,
        {
          method: "POST",
          headers:
            buildAuthorizationHeaders(
              session.access_token
            ),
          body: formData
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Upload failed."
        );
      }

      if (data.success) {
        setUploadMessage(
          `Document indexed successfully. ${data.chunksCreated} searchable sections created.`
        );

        await loadDocuments(
          session.access_token
        );
      }

    } catch (error) {
      console.error(
        "UPLOAD ERROR:",
        error
      );

      setUploadMessage(
        error.message ||
        "Upload failed."
      );
    }
  }

  /******************************************************************************
   * Rendering
   ******************************************************************************/

  if (authLoading) {
    return (
      <div className="app-shell">
        <main className="workspace">
          <p>
            Establishing session...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="eyebrow">
          Enterprise Knowledge Infrastructure
        </div>

        <h1>
          Knowledge Assistant
        </h1>

        <p>
          Grounded answers backed by retrieved organizational evidence,
          supporting excerpts, and transparent source context.
        </p>
      </header>

      <main className="workspace">
        <AuthPanel
          session={session}
          onSessionChange={setSession}
        />

        {!session?.user ? (
          <p>
            Sign in to access organizational knowledge.
          </p>
        ) : (
          <>
            <UploadPanel
              pdfFile={pdfFile}
              setPdfFile={setPdfFile}
              uploadPdf={uploadPdf}
              uploadMessage={uploadMessage}
            />

            <div
              className={`workspace-grid ${
                libraryCollapsed
                  ? "library-is-collapsed"
                  : ""
              }`}
            >
              <KnowledgeLibrary
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={selectDocument}
                collapsed={libraryCollapsed}
                onToggleCollapsed={() =>
                  setLibraryCollapsed(
                    (current) =>
                      !current
                  )
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;