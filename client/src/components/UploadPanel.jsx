/******************************************************************************
 * File: UploadPanel.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays the document upload workspace responsible for indexing PDF
 * documents into the enterprise knowledge base.
 ******************************************************************************/

function UploadPanel({
  pdfFile,
  setPdfFile,
  uploadPdf,
  uploadMessage
}) {
  return (
    <section className="card">

      <div className="card-header">
        <div>
          <h2>Upload PDF</h2>

          <p>
            Index internal documentation for semantic retrieval.
          </p>
        </div>
      </div>

      <div className="upload-row">

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <button
          onClick={uploadPdf}
          disabled={!pdfFile}
        >
          Upload PDF
        </button>

      </div>

      {uploadMessage && (
        <div className="status-message">
          {uploadMessage}
        </div>
      )}

    </section>
  );
}

export default UploadPanel;