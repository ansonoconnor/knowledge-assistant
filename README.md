# Knowledge Assistant Prototype

An enterprise knowledge retrieval and document exploration platform that enables
employees to search organizational documentation using semantic retrieval while
providing transparent evidence, document inspection, and navigable knowledge
relationships.

---

## Purpose

Traditional AI chat interfaces answer questions but often hide where those
answers came from.

The Knowledge Assistant is designed around a different philosophy:

- Retrieval should be evidence-based.
- Organizational knowledge should be inspectable.
- Documents should be navigable independently of conversational AI.
- Every answer should expose supporting evidence.

The long-term goal is to build an internal AI knowledge platform that combines
semantic retrieval, document exploration, governance metadata, and knowledge
relationships into a single workspace.

---

## Architecture

### Frontend

```
App
│
├── UploadPanel
├── KnowledgeLibrary
├── DocumentInspector
├── QuestionPanel
├── AnswerPanel
└── EvidencePanel
```

Responsibilities are separated into independent presentation components while
`App.jsx` coordinates application state and API communication.

---

### Backend

```
Express API
│
├── PDF Upload
├── Retrieval API
├── Documents API
│
├── documentMetadataService
├── knowledgeRelationshipService
│
└── Supabase
      │
      └── knowledge_chunks
```

The backend is responsible for:

- indexing PDF documents
- semantic retrieval
- metadata extraction
- document inspection
- relationship discovery
- evidence generation

---

## Tech Stack

### Frontend

- React
- Vite

### Backend

- Node.js
- Express

### AI

- OpenAI Embeddings
- OpenAI Chat API

### Database

- Supabase
- PostgreSQL
- pgvector

---

## Features

### Document Upload

Upload PDF documents for indexing into the enterprise knowledge base.

---

### Semantic Search

Grounded question answering using vector retrieval.

---

### Evidence Display

Every generated answer includes:

- supporting documents
- supporting excerpts
- similarity scores

---

### Knowledge Library

Browse all indexed documents without asking a question.

Includes:

- document search
- department browsing
- owner information
- indexed section counts

---

### Document Inspector

Inspect enterprise documentation independently of conversational retrieval.

Displays:

- metadata
- purpose
- document structure
- related documents
- indexed sections

---

### Knowledge Relationships

Navigate between connected documents using relationship links.

(Current implementation uses a temporary hardcoded relationship service.)

---

## Current Status

Completed

- PDF indexing
- Embedding generation
- Vector storage
- Semantic retrieval
- Grounded answers
- Evidence panel
- Knowledge Library
- Document Inspector
- Metadata extraction
- Relationship navigation
- Modular React component architecture

In Progress

- App orchestration refactor
- Knowledge Explorer
- Metadata enrichment

Planned

- Relationship inference
- Knowledge graph visualization
- Department explorer
- Document versioning
- Authority scoring
- Governance dashboard
- Multi-document reasoning

---

## Next Steps

Short Term

- Complete App.jsx orchestration
- Finish presentation component separation
- Expand document metadata extraction
- Replace hardcoded relationships with inferred relationships

Medium Term

- Knowledge graph visualization
- Advanced filtering
- Document timeline
- Organizational explorer

Long Term

- Enterprise knowledge platform
- Knowledge governance
- Cross-document reasoning
- Organizational memory system
