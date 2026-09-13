const express = require("express");
const cors = require("cors");

const askRoute = require("./routes/ask");
const pdfRoute = require("./routes/pdf");
const documentsRoute = require("./routes/documents");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/ask", askRoute);
app.use("/pdf", pdfRoute);
app.use("/documents", documentsRoute);

app.get("/", (req, res) => {
  res.json({
    message: "Knowledge Assistant API running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});