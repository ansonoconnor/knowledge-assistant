# Knowledge Assistant

> **Enterprise AI workspace for semantic retrieval, document inspection, and evidence-backed organizational knowledge.**

---

![Knowledge Assistant](docs/images/hero.png)

**Built with:** React • Node.js • Express • OpenAI • Supabase • PostgreSQL • pgvector

---

## Overview

Knowledge Assistant is an enterprise AI application that helps organizations retrieve, inspect, and understand institutional knowledge stored across internal documentation.

Rather than layering a chatbot on top of enterprise documents, the application combines semantic retrieval, document inspection, metadata extraction, authenticated access, organization-scoped authorization, and evidence-backed responses into a unified workspace where organizational knowledge remains transparent, inspectable, and grounded in source material.

Instead of asking users to simply trust an AI-generated answer, Knowledge Assistant exposes the supporting evidence so users can understand both **what** the system concluded and **why** it reached that conclusion.

---

# Highlights

* Evidence-backed AI responses with transparent supporting sources
* Semantic search across enterprise documentation
* Authenticated workspace using Supabase Auth
* JWT validation at the Express API boundary
* Organization-scoped knowledge authorization
* Membership-based PostgreSQL Row Level Security
* Request-scoped database access using the authenticated user's JWT
* Organization-scoped vector retrieval
* Authorization preserved through evidence and LLM prompt context
* Protected document retrieval, question answering, and PDF ingestion
* Interactive document inspection with rich metadata
* Knowledge Library for browsing organizational documents
* Relationship-aware document exploration
* Modular React and Express architecture
* OpenAI-powered semantic retrieval
* Supabase + PostgreSQL + pgvector backend

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

* Building AI applications around organizational workflows rather than chat interfaces
* Designing evidence-backed AI systems where users can inspect supporting information
* Establishing authenticated identity before protected application operations
* Enforcing authentication at the API boundary rather than relying on frontend gating
* Preserving authenticated user authority through backend and database boundaries
* Modeling organizational ownership of knowledge
* Enforcing organizational scope through application constraints and PostgreSQL RLS
* Treating retrieval eligibility and prompt-context eligibility as part of authorization
* Separating presentation, retrieval, metadata, authentication, authorization, and AI orchestration into modular responsibilities
* Testing both authorized and unauthorized system behavior
* Treating organizational knowledge as a durable organizational asset
* Building software that organizations can extend and maintain over time

---

# Why I Built This

Organizations invest enormous effort creating documentation, including:

* Standard Operating Procedures
* Policies
* Employee Handbooks
* Technical Documentation
* Process Guides
* Compliance Manuals

Unfortunately, much of that knowledge becomes difficult to discover and even harder to trust.

Many AI document assistants focus primarily on generating answers.

I wanted to explore a different approach.

Instead of hiding organizational knowledge behind a chat interface, I wanted to build a workspace where users can:

* Browse organizational knowledge
* Inspect documents independently
* Explore relationships between documents
* Review supporting evidence
* Ask grounded questions
* Understand where retrieved information came from
* Access only the knowledge within their authorized organizational scope
* Use AI as one interface into organizational knowledge rather than the product itself

---

# Design Principles

Knowledge Assistant is built around a set of design principles for transparent and trustworthy enterprise AI.

### Knowledge already exists.

Organizations have already documented much of what they know.

The challenge is making that knowledge discoverable.

---

### Evidence should be visible.

Every AI response should expose the information used to generate it.

Users should be able to inspect the evidence rather than treating model output as an opaque conclusion.

---

### Identity should be established before protected work.

Reaching an API endpoint should not be sufficient to exercise protected application capabilities.

Protected operations require an authenticated principal whose token is independently validated by the backend.

---

### Authority should survive the intermediary.

A backend may possess broader technical capability than the user on whose behalf it acts.

Ordinary user operations should preserve the authenticated principal's narrower authority rather than silently inheriting application-wide privileges.

---

### Relevance does not create authority.

Semantic similarity determines which **authorized** knowledge may be useful for a question.

It does not determine which knowledge a user is entitled to retrieve.

Authorization should occur before unauthorized evidence can enter retrieval results or model context.

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

Both operate inside an authenticated organizational scope.

## Document Ingestion

```text
Authenticated User
      │
      ▼
Bearer JWT
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
Organization Membership
      │
      ▼
Authorized Organization Scope
      │
      ▼
Request-Scoped Supabase Client
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
Chunks + organization_id
      │
      ▼
PostgreSQL + RLS + pgvector
      │
      ▼
Authorized Searchable Knowledge
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
JWT Validation
      │
      ▼
Verified User
      │
      ▼
Organization Membership
      │
      ▼
Authorized Organization Scope
      │
      ▼
Question Embedding
      │
      ▼
Organization-Scoped Semantic Retrieval
      │
      ▼
PostgreSQL RLS
      │
      ▼
Authorized Evidence
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

* Authenticated upload
* Organization-scoped ingestion
* PDF parsing
* Upload size validation
* Temporary-file lifecycle cleanup
* Chunk generation
* Embedding generation
* Organization provenance
* Vector storage

Authentication is evaluated before file-processing middleware accepts the upload.

New knowledge is persisted with the organization scope established from the authenticated user's membership.

---

## Knowledge Library

Browse indexed documentation without asking a question.

Features include:

* Authenticated access
* Organization-scoped document visibility
* Live search
* Department grouping
* Document selection
* Metadata display
* Collapsible navigation

The application constrains document queries to the active organization while PostgreSQL RLS remains an independent authorization boundary.

---

## Document Inspector

Inspect enterprise documents independently of conversational retrieval.

Displays:

* Department
* Owner
* Status
* Revision
* Effective Date
* Purpose
* Document structure
* Related documents
* Indexed sections

---

## Semantic Question Answering

Ask operational questions against indexed organizational knowledge.

Responses are generated from retrieved evidence rather than unsupported reasoning.

Before retrieval begins, the application establishes:

```text
verified identity
→ organization membership
→ authorized knowledge scope
```

Semantic similarity is then evaluated only within the eligible organizational knowledge boundary.

---

## Evidence Workspace

Every AI response includes supporting evidence.

Evidence currently includes:

* Supporting documents
* Supporting excerpts
* Similarity scores
* Retrieved section counts

The same authorized retrieval results used to construct the evidence set are also used to assemble grounded model context.

The application intentionally emphasizes transparency over opaque confidence metrics.

---

# Authentication & Resource Authorization

Knowledge Assistant separates authentication from authorization.

Authentication answers:

> **Who is making this request?**

Authorization answers:

> **What organizational knowledge is this authenticated principal allowed to use?**

Both are required.

## Authentication Boundary

The React client uses Supabase Auth to establish an authenticated session and sends the user's access token with protected API requests.

The Express API independently validates that Bearer token through Supabase Auth.

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
```

Protected operations currently include:

* Document library retrieval
* Evidence-backed question answering
* PDF ingestion and indexing

Anonymous requests to protected endpoints are rejected with `401 Unauthorized`.

The browser does not establish trusted identity by supplying a user ID, email address, or role.

The API validates the signed access token before attaching the verified user to the request.

For PDF ingestion, authentication is evaluated before upload-processing middleware, preventing anonymous callers from initiating file processing, embedding generation, or persistence.

---

## Organization Authorization

After authentication, the server creates a request-scoped Supabase client carrying the verified user's JWT.

The application then resolves the user's organizational membership.

```text
Verified User
      │
      ▼
Request-Scoped Supabase Client
      │
      ▼
organization_memberships
      │
      ▼
Authorized Organization
      │
      ▼
req.organizationId
```

Ordinary user database operations therefore execute with the authenticated user's authority rather than application-wide service-role authority.

Knowledge Assistant currently presents one active organizational corpus to a user.

Requests without organizational membership fail closed. Ambiguous multiple memberships require organization selection before ordinary knowledge operations proceed.

---

## Database Enforcement

Knowledge chunks carry explicit organizational ownership:

```text
knowledge_chunks.organization_id
```

PostgreSQL Row Level Security limits authenticated `SELECT` and `INSERT` operations to organizations where the authenticated user has membership.

Conceptually:

```text
Authenticated User
      │
      ▼
auth.uid()
      │
      ▼
organization_memberships
      │
      ▼
knowledge_chunks.organization_id
      │
      ▼
Authorized Knowledge
```

The application also supplies explicit organization predicates.

This results in two cooperating boundaries:

```text
Application Organization Scope
            +
PostgreSQL Row Level Security
            ↓
Authorized Organizational Knowledge
```

---

# Authorization Through the RAG Pipeline

Authorization in a retrieval-augmented system cannot stop at document browsing.

A document hidden from a navigation interface is still exposed if one of its chunks can enter semantic retrieval.

Knowledge Assistant therefore treats retrieval eligibility and prompt-context eligibility as part of resource authorization.

```text
Identity
  │
  ▼
Organization Membership
  │
  ▼
Authorized Knowledge Scope
  │
  ▼
Document / Chunk Eligibility
  │
  ▼
Semantic Retrieval
  │
  ▼
Evidence
  │
  ▼
Model Context
  │
  ▼
Generated Answer
```

This reflects an important architectural principle:

> **Relevance does not create authority.**

A document being highly relevant to a question does not mean the requesting user is entitled to retrieve its contents.

Unauthorized knowledge should not become a retrieval candidate.

If it cannot enter retrieval, it cannot become supporting evidence or grounded model context.

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

A browser-side Supabase client manages authentication using public client configuration.

---

## Backend

```text
Express API
│
├── Authentication Middleware
│     │
│     ├── JWT Validation
│     ├── Membership Resolution
│     ├── Request-Scoped Supabase Client
│     └── Organization Scope
│
├── Upload Route
├── Ask Route
├── Documents Route
│
├── Ingestion Service
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
            ├── organizations
            ├── organization_memberships
            └── knowledge_chunks
```

Backend responsibilities include:

* Authentication validation
* Membership resolution
* Organization-scope propagation
* PDF ingestion
* Embedding generation
* Semantic retrieval
* Metadata extraction
* Relationship navigation
* Evidence construction
* Prompt assembly

---

# Retrieval Architecture

When an authenticated user asks a question:

1. The API validates the user's Bearer token through Supabase Auth.
2. The server establishes the user's authorized organization from membership.
3. A request-scoped Supabase client carries the verified user's JWT into database operations.
4. The question is converted into an embedding using OpenAI.
5. The application invokes an organization-aware PostgreSQL `match_chunks` function.
6. The retrieval function executes with **invoker authority**, preserving PostgreSQL RLS.
7. Candidate chunks are explicitly constrained to the active organization.
8. pgvector compares the question vector against authorized document-chunk embeddings using cosine distance.
9. Matching chunks are filtered and ranked by semantic similarity.
10. Retrieved chunks are transformed into a structured evidence set.
11. The same authorized knowledge is assembled into grounded context supplied to the language model.
12. The generated answer and supporting evidence are returned together to the client.

```text
Question
   │
   ▼
Embedding
   │
   ▼
Authorized Organization
   │
   ▼
match_chunks(...)
   │
   ├── Organization Constraint
   │
   └── PostgreSQL RLS
   │
   ▼
Authorized Vector Candidates
   │
   ▼
Evidence
   │
   ▼
Grounded Model Context
   │
   ▼
Answer
```

This keeps retrieval, evidence construction, and source eligibility under application and database control rather than asking the language model to determine its own sources after generation.

---

# Authorization Validation

The authorization model has been exercised against a disposable Supabase environment containing two organizations, two authenticated users, and distinct knowledge for each organization.

The tested isolation matrix was:

```text
User A → Organization A     ALLOW
User A → Organization B     DENY

User B → Organization B     ALLOW
User B → Organization A     DENY
```

Validation covered:

* Organization membership
* Ingestion provenance
* Cross-organization insertion denial
* Document isolation
* Vector retrieval isolation
* Evidence isolation
* Prompt-context isolation

The authorization property was tested beyond the visible UI because filtering document navigation alone would not protect a RAG system if unauthorized chunks remained eligible for semantic retrieval.

---

# Engineering Challenges

This project explores several architectural challenges common to enterprise AI systems.

* Designing evidence-backed AI instead of opaque chat interactions
* Separating document inspection from conversational retrieval
* Modeling organizational documents as durable organizational assets
* Establishing trusted identity at the API boundary
* Distinguishing frontend access gating from backend security enforcement
* Separating authentication from resource authorization
* Preserving user authority through a backend intermediary
* Avoiding unnecessary service-role authority for ordinary requests
* Applying organization ownership to stored knowledge
* Combining application-level scope with PostgreSQL RLS
* Authorizing semantic retrieval before evidence construction
* Preventing unauthorized information from entering model context
* Testing both allowed and denied authorization paths
* Coordinating application and database changes safely
* Keeping retrieval, metadata, authentication, authorization, and AI orchestration independently understandable
* Balancing retrieval quality with transparency and user trust

---

# Technology Stack

### Frontend

* React
* Vite
* Supabase Auth Client

### Backend

* Node.js
* Express

### AI

* OpenAI Embeddings
* OpenAI Chat API

### Database & Identity

* Supabase
* Supabase Auth
* PostgreSQL
* PostgreSQL Row Level Security
* pgvector

---

# Project Status

Knowledge Assistant is an active portfolio and engineering project.

Current capabilities include:

* PDF ingestion
* Chunk generation
* Embedding generation
* Vector storage
* Semantic retrieval
* Grounded AI responses
* Evidence workspace
* Knowledge Library
* Document Inspector
* Metadata extraction
* Relationship navigation
* Modular React architecture
* Service-oriented backend architecture
* Supabase user authentication
* Browser session restoration
* Bearer-token API requests
* Server-side JWT validation
* Authentication protection for document retrieval
* Authentication protection for question answering
* Authentication protection for PDF ingestion
* Organization-owned knowledge chunks
* Organization membership resolution
* Request-scoped user database authority
* Membership-based PostgreSQL RLS
* Organization-scoped document access
* Organization-scoped ingestion
* Organization-scoped semantic retrieval
* Security-invoker vector retrieval
* Evidence isolation
* Prompt-context isolation
* Cross-organization authorization validation

The project continues to evolve as additional enterprise knowledge, retrieval, workflow, and implementation problems are explored.

---

# Roadmap

Potential areas for continued development include:

* More flexible organization selection
* More granular resource authorization where justified
* Enhanced document relationships
* Richer metadata extraction
* Cross-document navigation
* Improved evidence visualization
* Retrieval-quality evaluation
* Conflict and no-evidence handling
* Performance optimization
* Deployment and operational tooling

Development is intentionally driven by concrete system requirements rather than treating every possible enterprise capability as an automatic feature requirement.

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

### Browser

The browser uses public Supabase client configuration:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The frontend API location may be configured with:

```text
VITE_API_BASE_URL
```

### Server

The server uses Supabase configuration for authentication and request-scoped database access:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

OpenAI operations require:

```text
OPENAI_API_KEY
```

Environment files and credentials must remain outside source control.

---

## Start

### Backend

```bash
cd server
npm run dev
```

The backend defaults to port `5001` when `PORT` is not supplied.

### Frontend

```bash
cd client
npm run dev
```

The frontend defaults to:

```text
http://localhost:5001
```

when `VITE_API_BASE_URL` is not supplied.

---

# About This Project

Knowledge Assistant was built as a portfolio project exploring enterprise AI implementation, information architecture, knowledge systems engineering, retrieval, and application trust boundaries.

Rather than serving as a demonstration of Retrieval-Augmented Generation alone, the project explores how organizational knowledge can remain transparent, inspectable, evidence-backed, and accessible through appropriately scoped application boundaries.

The project intentionally distinguishes authentication from authorization.

The application establishes caller identity at the API boundary, preserves that user's authority through request-scoped database access, resolves organizational membership, and constrains ingestion, document access, semantic retrieval, evidence, and model context to authorized organizational knowledge.

The broader goal is to explore how AI can become a trustworthy interface into organizational knowledge without replacing the systems, provenance, evidence, and human judgment that make that knowledge useful.

---

# License

This repository is provided for portfolio and educational purposes.

Please do not redistribute substantial portions of the project without permission.

---

# Author

**Anson O'Connor**

AI Implementation & Workflow Systems Architect

Austin, Texas

**LinkedIn:** [www.linkedin.com/in/ansonoconnor](http://www.linkedin.com/in/ansonoconnor)

**Website:** [www.synapseflowsystems.com](http://www.synapseflowsystems.com)
