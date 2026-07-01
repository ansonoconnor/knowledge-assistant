const baseConstitution = require("./baseConstitution");

function buildPrompt(context, question) {
  return [
    {
      role: "system",
      content: baseConstitution
    },
    {
      role: "user",
      content: `
Retrieved Knowledge:

${context}

Question:

${question}
`
    }
  ];
}

module.exports = {
  buildPrompt
};