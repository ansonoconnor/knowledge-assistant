# Knowledge Assistant

> **Enterprise knowledge workspace for semantic retrieval, document inspection, and evidence-based AI.**

---

![Knowledge Assistant](docs/images/hero.png)

---

## Overview

The Knowledge Assistant is an enterprise knowledge workspace designed to help organizations retrieve, inspect, and understand institutional knowledge stored across internal documentation.

Rather than functioning as a traditional AI chatbot, the application combines semantic retrieval, document inspection, metadata extraction, and transparent evidence into a single workspace where organizational knowledge can be explored independently of conversation.

The project emphasizes an evidence-first approach to AI by helping users understand not only **what** the system concludes, but **why** it reached that conclusion.

---

# Why I Built This

Organizations invest enormous effort creating documentation:

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

- browse organizational knowledge,
- inspect documents,
- understand relationships,
- review supporting evidence,
- and use AI as one interface into that knowledge rather than the product itself.

---

# Product Philosophy

The application is built around five principles.

### 1. Knowledge already exists.

Organizations have already documented much of what they know.

The challenge is making that knowledge accessible.

---

### 2. Evidence should be visible.

Every AI response should expose the information used to generate it.

---

### 3. Documents are first-class objects.

Documents remain inspectable independently of conversational AI.

---

### 4. Relationships matter.

Knowledge becomes more valuable when related documents can be explored together.

---

### 5. Human judgment remains central.

The goal is not replacing organizational expertise.

The goal is supporting better decisions through transparent information.

---

# Typical Workflow

```text
Upload Enterprise Documents
          ↓
Automatic Parsing
          ↓
Semantic Indexing
          ↓
Knowledge Library
          ↓
Document Inspection
          ↓
Ask Questions
          ↓
Grounded Response
          ↓
Supporting Evidence
          ↓
Human Judgment
```

---

# Current Features

## Document Upload

Upload enterprise PDF documentation for semantic indexing.

Current capabilities include:

- PDF parsing
- Chunk generation
- Embedding creation
- Vector storage

---

## Knowledge Library

Browse indexed documentation without asking a question.

Current capabilities include:

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
- Effective date
- Purpose
- Document structure
- Related documents
- Indexed sections

---

## Semantic Question Answering

Ask operational questions against indexed organizational knowledge.

Responses are generated from retrieved evidence rather than unsupported reasoning.

---

## Evidence Workspace

Every response includes supporting evidence.

Current evidence presentation includes:

- Supporting documents
- Supporting excerpts
- Similarity scores
- Retrieved section counts

The application intentionally emphasizes transparency over opaque confidence metrics.

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

Inspect document metadata, purpose, structure, indexed sections, and related documents without relying on AI-generated responses.

---

## Evidence Workspace

![Evidence](docs/images/evidence.png)

Every response includes transparent supporting evidence so users can verify conclusions against retrieved organizational knowledge.

---

# Architecture

## Frontend

```text
App.jsx
│
├── UploadPanel
├── KnowledgeLibrary
├── DocumentInspector
├── QuestionPanel
├── AnswerPanel
└── EvidencePanel
```

Presentation responsibilities remain isolated while `App.jsx` coordinates application state and API communication.

---

## Backend

```text
Express API
│
├── Upload Route
├── Retrieval Route
├── Documents Route
│
├── Retrieval Service
├── Evidence Service
├── documentMetadataService
├── knowledgeRelationshipService
│
└── Supabase
      │
      └── knowledge_chunks
```

Backend responsibilities include:

- PDF ingestion
- Embedding generation
- Semantic retrieval
- Metadata extraction
- Relationship navigation
- Evidence construction
- Prompt assembly

---

# Engineering Principles

### Separation of Concerns

Presentation, domain services, infrastructure, and AI orchestration remain independently evolvable.

---

### Evidence Before Trust

Evidence is constructed independently of prompt generation and remains inspectable after responses are generated.

---

### Documents Before Conversation

Documents are modeled as persistent organizational assets rather than temporary retrieval targets.

---

### AI as Infrastructure

Large language models provide one interface into organizational knowledge.

They do not define the product.

---

# Technology Stack

## Frontend

- React
- Vite

## Backend

- Node.js
- Express

## AI

- OpenAI Embeddings
- OpenAI Chat API

## Database

- Supabase
- PostgreSQL
- pgvector

---

# Current Project Status

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

---

## Active Development

Current development focuses on expanding the enterprise knowledge experience.

Areas under active development include:

- Richer metadata
- Relationship inference
- Knowledge explorer
- Evidence refinement
- Enterprise demo organization

---

# Roadmap

Planned future capabilities include:

- Knowledge Explorer
- Knowledge graph visualization
- Governance dashboard
- Authority-aware retrieval
- Cross-document reasoning
- Document versioning
- Organizational knowledge analytics

---

# Running the Project


## Install

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd server
npm install
```

---

## Start

Backend

```bash
cd server
npm run dev
```

Frontend

```bash
cd client
npm run dev
```

---

# About This Project

This project is actively being developed as a portfolio demonstration of enterprise AI implementation, information architecture, and knowledge systems engineering.

Its purpose is not simply to demonstrate Retrieval-Augmented Generation (RAG), but to explore how organizations can interact with documented knowledge through evidence, transparency, and structured information.

---

# License

This repository is provided for portfolio and educational purposes.

Please do not redistribute substantial portions of the project without permission.

---

# Author

**Anson O'Connor**

AI Implementation & Workflow Systems Architect

Austin, Texas

**LinkedIn:** https://www.linkedin.com/in/anson-o-connor-2404b4282

*Portfolio website coming soon.*
