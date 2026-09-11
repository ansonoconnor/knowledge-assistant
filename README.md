# Knowledge Assistant

> **Enterprise AI workspace for semantic retrieval, document inspection, and evidence-backed organizational knowledge.**

---

![Knowledge Assistant](docs/images/hero.png)

**Built with:** React • Node.js • Express • OpenAI • Supabase • PostgreSQL • pgvector

---

## Overview

Knowledge Assistant is an enterprise AI application that helps organizations retrieve, inspect, and understand institutional knowledge stored across internal documentation.

Rather than layering a chatbot on top of enterprise documents, the application combines semantic retrieval, document inspection, metadata extraction, authenticated access, and evidence-backed responses into a unified workspace where organizational knowledge remains transparent, inspectable, and grounded in source material.

Instead of asking users to simply trust an AI-generated answer, Knowledge Assistant exposes the supporting evidence so users can understand both **what** the system concluded and **why** it reached that conclusion.

---

# Highlights

- Evidence-backed AI responses with transparent supporting sources
- Semantic search across enterprise documentation
- Authenticated workspace using Supabase Auth
- JWT validation at the Express API boundary
- Protected document retrieval, question answering, and PDF ingestion
- Interactive document inspection with rich metadata
- Knowledge Library for browsing organizational documents
- Relationship-aware document exploration
- Modular React and Express architecture
- OpenAI-powered semantic retrieval
- Supabase + PostgreSQL + pgvector backend

---

# Screenshots

## Enterprise Workspace

![Workspace](docs/images/workspace.png)

The primary workspace combines document inspection, grounded AI responses, and supporting evidence into a unified enterprise experience.

---

## Knowledge Library

![Knowledge Library](docs/images/library.png)

Browse organizational documentation by department, search indexed content, and inspect documents independently of conversation.

---

## Document Inspector

![Document Inspector](docs/images/inspector.png)

Inspect document metadata, structure, indexed sections, and related documents without relying on AI-generated responses.

---

## Evidence Workspace

![Evidence](docs/images/evidence.png)

Every response includes transparent supporting evidence so users can verify conclusions against retrieved organizational knowledge.

---

# What This Project Demonstrates

This project demonstrates my approach to enterprise AI implementation.

- Building AI applications around organizational workflows rather than chat interfaces
- Designing evidence-backed AI systems where users can inspect supporting information
- Establishing authenticated identity before privileged application operations
- Enforcing authentication at the API boundary rather than relying on frontend gating
- Separating presentation, retrieval, metadata, authentication, and AI orchestration into modular responsibilities
- Treating organizational knowledge as a durable organizational asset
- Building software that organizations can extend and maintain over time

---

# Why I Built This

Organizations invest enormous effort creating documentation, including:

- Standard Operating Procedures
- Policies
- Employee Handbooks
- Technical Documentation
- Process Guides
- Compliance Manuals

Unfortunately, much of that knowledge becomes difficult to discover and even harder to trust.

Many AI document assistants focus primarily on generating answers.

I wanted to explore a different approach.

Instead of hiding organizational knowledge behind a chat interface, I wanted to build a workspace where users can:

- Browse organizational knowledge
- Inspect documents independently
- Explore relationships between documents
- Review supporting evidence
- Use AI as one interface into organizational knowledge rather than the product itself

---

# Design Principles

Knowledge Assistant is built around six design principles.

### Knowledge already exists.

Organizations have already documented much of what they know.

The challenge is making that knowledge discoverable.

---

### Evidence should be visible.

Every AI response should expose the information used to generate it.

---

### Identity should be established before privileged work.

Reaching an API endpoint should not be sufficient to exercise privileged application capabilities.

Protected operations require an authenticated principal whose token is independently validated by the backend.

---

### Documents are durable organizational assets.

Documents remain independently inspectable regardless of how users interact with AI.

---

### Relationships matter.

Knowledge becomes more valuable when related documents can be explored together.

---

### Human judgment remains central.

The goal is not replacing organizational expertise.

The goal is supporting better decisions through transparent information.

---

# Application Flow

Knowledge Assistant contains two primary pipelines: document ingestion and evidence-backed question answering.

## Document Ingestion

```text
Authenticated User
      │
      ▼
Express API
      │
      ▼
Authentication Validation
      │
      ▼
PDF Upload
      │
      ▼
Text Extraction
      │
      ▼
Chunk Generation
      │
      ▼
Embedding Generation
      │
      ▼
PostgreSQL + pgvector
      │
      ▼
Searchable Knowledge
```

## Question Answering

```text
Authenticated User
      │
      ▼
Question
      │
      ▼
Express API
      │
      ▼
Authentication Validation
      │
      ▼
Question Embedding
      │
      ▼
Semantic Retrieval
      │
      ▼
Evidence Construction
      │
      ▼
Grounded Model Context
      │
      ▼
AI Response
      │
      ▼
Answer + Supporting Evidence
```

---

# Features

## Document Upload

Upload enterprise PDF documentation for semantic indexing.

Current capabilities include:

- Authenticated upload
- PDF parsing
- Chunk generation
- Embedding generation
- Vector storage

Authentication is evaluated before file-processing middleware accepts the upload.

---

## Knowledge Library

Browse indexed documentation without asking a question.

Features include:

- Authenticated access
- Live search
- Department grouping
- Document selection
- Metadata display
- Collapsible navigation

---

## Document Inspector

Inspect enterprise documents independently of conversational retrieval.

Displays:

- Department
- Owner
- Status
- Revision
- Effective Date
- Purpose
- Document structure
- Related documents
- Indexed sections

---

## Semantic Question Answering

Ask operational questions against indexed organizational knowledge.

Responses are generated from retrieved evidence rather than unsupported reasoning.

Questions are processed only after the API establishes an authenticated user.

---

## Evidence Workspace

Every AI response includes supporting evidence.

Evidence currently includes:

- Supporting documents
- Supporting excerpts
- Similarity scores
- Retrieved section counts

The application intentionally emphasizes transparency over opaque confidence metrics.

---

# Authentication & Security

Knowledge Assistant establishes user identity before allowing access to privileged application capabilities.

The React client uses Supabase Auth to establish an authenticated session and sends the user's access token with protected API requests. The Express API independently validates that Bearer token through Supabase Auth before performing document retrieval, question answering, or PDF ingestion.

## Current Authentication Boundary

```text
User
  │
  ▼
Supabase Auth
  │
  ▼
Authenticated Session / JWT
  │
  ▼
React Client
  │
  ▼
Authorization: Bearer <token>
  │
  ▼
Express API
  │
  ▼
JWT Validation
  │
  ▼
Verified User
  │
  ▼
Protected Application Operation
```

Protected operations currently include:

- Document library retrieval
- Evidence-backed question answering
- PDF ingestion and indexing

Anonymous requests to protected endpoints are rejected with `401 Unauthorized`.

The browser does not establish trusted identity by supplying a user ID or role. The API validates the signed access token before attaching the verified user to the request.

For PDF ingestion, authentication is evaluated before upload-processing middleware, preventing anonymous callers from initiating file processing, embedding generation, or persistence.

## Authentication vs. Authorization

The current implementation establishes **who the caller is** and prevents anonymous access to protected application capabilities.

It does **not** yet implement organization-, department-, or document-level authorization. Authenticated users currently share access to the same knowledge corpus.

A future resource-authorization layer would constrain the eligible knowledge corpus before semantic retrieval:

```text
Identity
  │
  ▼
Organization Membership
  │
  ▼
Resource Authorization
  │
  ▼
Permitted Knowledge Corpus
  │
  ▼
Semantic Retrieval
  │
  ▼
Evidence
  │
  ▼
Grounded Answer
```

This reflects an important architectural principle:

> **Relevance does not create authority.**

A document being highly relevant to a question does not mean the requesting user is entitled to retrieve its contents. Resource authorization should therefore occur before unauthorized evidence can enter the evidence set or model context.

---

# Architecture

## Frontend

```text
App.jsx
│
├── AuthPanel
├── UploadPanel
├── KnowledgeLibrary
├── DocumentInspector
├── QuestionPanel
├── AnswerPanel
└── EvidencePanel
```

`App.jsx` coordinates application state, authenticated session state, and API communication while presentation responsibilities remain isolated in dedicated components.

A browser-side Supabase client manages authentication using public client configuration. Privileged Supabase credentials remain server-side.

---

## Backend

```text
Express API
│
├── Authentication Middleware
│
├── Upload Route
├── Ask Route
├── Documents Route
│
├── Retrieval Service
├── Evidence Service
├── documentMetadataService
├── knowledgeRelationshipService
│
├── OpenAI
│
└── Supabase
      │
      └── PostgreSQL + pgvector
            │
            └── knowledge_chunks
```

Backend responsibilities include:

- Authentication validation
- PDF ingestion
- Embedding generation
- Semantic retrieval
- Metadata extraction
- Relationship navigation
- Evidence construction
- Prompt assembly

The Express API performs privileged operations only after the authentication middleware establishes a verified user.

---

# Retrieval Architecture

When an authenticated user asks a question:

1. The question is converted into an embedding using OpenAI.
2. The embedding is passed through Supabase to a PostgreSQL retrieval function.
3. pgvector compares the question vector against stored document-chunk embeddings using cosine distance.
4. Matching chunks are filtered and ranked by semantic similarity.
5. Retrieved chunks are transformed into a structured evidence set.
6. The same retrieved knowledge is assembled into the grounded context supplied to the language model.
7. The generated answer and supporting evidence are returned together to the client.

This keeps retrieval and evidence construction under application control rather than asking the language model to determine its own sources after generation.

---

# Engineering Challenges

This project explores several architectural challenges common to enterprise AI systems.

- Designing evidence-backed AI instead of opaque chat interactions
- Separating document inspection from conversational retrieval
- Modeling organizational documents as durable organizational assets
- Establishing trusted identity at the API boundary
- Distinguishing frontend access gating from backend security enforcement
- Separating authentication from resource-level authorization
- Preventing privileged operations from executing before identity is established
- Keeping retrieval, metadata, authentication, and AI orchestration independently evolvable
- Balancing retrieval quality with transparency and user trust

---

# Technology Stack

### Frontend

- React
- Vite
- Supabase Auth Client

### Backend

- Node.js
- Express

### AI

- OpenAI Embeddings
- OpenAI Chat API

### Database & Identity

- Supabase
- Supabase Auth
- PostgreSQL
- pgvector

---

# Project Status

## Completed

- PDF ingestion
- Chunk generation
- Embedding generation
- Vector storage
- Semantic retrieval
- Grounded AI responses
- Evidence workspace
- Knowledge Library
- Document Inspector
- Metadata extraction
- Relationship navigation
- Modular React architecture
- Service-oriented backend architecture
- Supabase user authentication
- Browser session restoration
- Bearer-token API requests
- Server-side JWT validation
- Authentication protection for document retrieval
- Authentication protection for question answering
- Authentication protection for PDF ingestion

---

# Roadmap

Future improvements may include:

- Organization and membership modeling
- Resource-level document authorization before retrieval
- Enhanced document relationships
- Richer metadata extraction
- Cross-document navigation
- Improved evidence visualization
- Performance optimization

The current authentication layer establishes caller identity. Future authorization work would determine which organizational resources an authenticated principal is entitled to retrieve.

---

# Running the Project

## Install

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

## Environment Configuration

The application requires separate client and server environment configuration.

The browser uses only public Supabase client configuration:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Privileged credentials such as the Supabase service-role key and OpenAI API key must remain server-side and must not be exposed through Vite or committed to source control.

---

## Start

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

---

# About This Project

Knowledge Assistant was built as a portfolio project exploring enterprise AI implementation, information architecture, knowledge systems engineering, and application trust boundaries.

Rather than serving as a demonstration of Retrieval-Augmented Generation (RAG) alone, the project explores how organizational knowledge can remain transparent, inspectable, evidence-backed, and accessible through authenticated application boundaries.

The project intentionally distinguishes its current authenticated-access model from future resource-level authorization rather than treating login as equivalent to complete enterprise access control.

---

# License

This repository is provided for portfolio and educational purposes.

Please do not redistribute substantial portions of the project without permission.

---

# Author

**Anson O'Connor**

AI Implementation & Workflow Systems Architect

Austin, Texas

**LinkedIn:** www.linkedin.com/in/ansonoconnor

**Website:** www.synapseflowsystems.com
