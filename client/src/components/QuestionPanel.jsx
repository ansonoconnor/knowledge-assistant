/******************************************************************************
 * File: QuestionPanel.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays the conversational query workspace for asking grounded questions
 * against the enterprise knowledge base.
 ******************************************************************************/

function QuestionPanel({
  question,
  setQuestion,
  askQuestion,
  loading
}) {
  return (
    <section className="card">

      <div className="card-header">
        <div>
          <h2>Ask a Question</h2>

          <p>
            Query the indexed knowledge base for a grounded response.
          </p>
        </div>
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about your uploaded documentation..."
      />

      <button
        onClick={askQuestion}
        disabled={loading || !question.trim()}
      >
        {loading
          ? "Searching organizational knowledge..."
          : "Generate Answer"}
      </button>

    </section>
  );
}

export default QuestionPanel;