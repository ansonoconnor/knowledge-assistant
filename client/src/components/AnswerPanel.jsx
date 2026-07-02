/******************************************************************************
 * File: AnswerPanel.jsx
 * Layer: Presentation
 * Responsibility:
 * Displays the grounded answer returned from the enterprise knowledge base.
 ******************************************************************************/

function AnswerPanel({ answer }) {
  return (
    <section className="card">

      <div className="card-header">
        <div>
          <h2>Answer</h2>

          <p>
            Grounded response generated from retrieved documentation.
          </p>
        </div>
      </div>

      <div className={answer ? "answer" : "empty-state"}>

        {answer ||
          "Ask a question about your organization's documentation. Grounded responses will appear here."}

      </div>

    </section>
  );
}

export default AnswerPanel;