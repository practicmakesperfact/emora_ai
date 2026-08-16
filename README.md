# 🧠 Emora — AI-Driven Mental Health Support Chatbot

> An intelligent, local-first mental health chatbot backend built with **FastAPI**, **LangGraph**, **Groq**, **ChromaDB**, and **PostgreSQL**.  


---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Installation Guide](#installation-guide)
6. [Environment Variables](#environment-variables)
7. [Running the Server](#running-the-server)
8. [API Endpoints](#api-endpoints)
9. [Agentic AI Pipeline](#agentic-ai-pipeline)
10. [RAG System](#rag-system)
11. [Database Schema](#database-schema)
12. [Running Tests](#running-tests)

---

## Project Overview

**Emora** is an AI-driven mental health support chatbot backend that provides:

- 🤝 Empathetic conversations with context memory
- 🧘 CBT (Cognitive Behavioral Therapy) guided exercises
- 📔 Daily journaling with AI analysis (summary, emotions, keywords)
- 📊 Mood tracking with weekly/monthly trend analysis
- 🚨 Automatic crisis detection with incident logging for counselors
- 📚 Retrieval-Augmented Generation (RAG) from trusted mental health resources
- 🛡️ Input guardrails (blocks prompt injection, jailbreaks, medical advice)
- 👥 Role-Based Access Control: **User**, **Counselor**, **Admin**

> ⚠️ Emora is an AI assistant and is **not** a licensed mental health professional. It does not diagnose or prescribe medication.

---

## Technology Stack

| Category | Technology |
|---|---|
| Language | Python 3.13+ |
| Framework | FastAPI |
| AI Framework | LangGraph |
| LLM | Llama 3.1 8B Instruct via Groq API (Free Tier) |
| Embedding Model | `nomic-embed-text` via Ollama (local, offline) |
| Vector Database | ChromaDB (persistent, local) |
| Relational Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (Async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) |
| Validation | Pydantic v2 |
| Logging | Structlog |
| Testing | Pytest + pytest-asyncio |
| API Docs | Swagger UI (`/docs`) |

---

## System Architecture

```
Client (Swagger / Mobile App / Frontend)
            │
            ▼
    ┌───────────────┐
    │   FastAPI App  │  (app/main.py)
    │   /api/v1/*   │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  API Routers  │  auth, users, chat, messages,
    │               │  mood, journal, crisis, documents, rag
    └───────┬───────┘
            │
            ▼
    ┌────────────────┐
    │ Service Layer  │  ChatService, JournalService,
    │                │  CrisisService, DocumentService, RAGService
    └───────┬────────┘
            │
            ▼
    ┌─────────────────────────────────┐
    │   LangGraph Agentic Pipeline    │  (app/agents/)
    │                                 │
    │ Guardrail → Intent → Sentiment  │
    │ → Crisis → Memory → RAG →       │
    │ Router → Specialist →           │
    │ Validation → Generator          │
    └─────────┬───────────────────────┘
              │
    ┌─────────┴────────────┐
    │                      │
    ▼                      ▼
PostgreSQL             ChromaDB
(Conversations,        (Knowledge Base
 Messages, Users,       Embeddings)
 Mood, Journal,
 Crisis, Memory)
```

---

## Project Structure

```
Emora A/
├── app/
│   ├── agents/                     # LangGraph AI Agents
│   │   ├── workflow.py             # LangGraph state machine compiler
│   │   ├── guardrail.py            # Input safety filter
│   │   ├── intent.py               # Intent classification
│   │   ├── sentiment.py            # Emotion detection + DB logging
│   │   ├── crisis.py               # Risk assessment + incident logging
│   │   ├── memory.py               # Short + long-term memory retrieval
│   │   ├── rag_retrieval.py        # ChromaDB semantic search
│   │   ├── router.py               # Specialist routing
│   │   ├── cbt.py                  # CBT exercises agent
│   │   ├── journaling.py           # Journaling assistant agent
│   │   ├── mood_tracking.py        # Mood acknowledgment agent
│   │   ├── conversation.py         # General empathetic dialogue
│   │   ├── response_validation.py  # Output safety guard
│   │   └── response_generator.py   # Final output preparation
│   │
│   ├── api/v1/                     # REST API Routers
│   │   ├── api.py                  # Router aggregator
│   │   ├── auth.py                 # /auth — register, login
│   │   ├── users.py                # /users — profile, update, admin
│   │   ├── chat.py                 # /chat — conversations + streaming
│   │   ├── messages.py             # /messages — message-level access
│   │   ├── mood.py                 # /mood — logging, trends
│   │   ├── journal.py              # /journal — entries + AI analysis
│   │   ├── crisis.py               # /crisis — incident management
│   │   ├── documents.py            # /documents — knowledge base upload
│   │   └── rag.py                  # /rag — semantic search
│   │
│   ├── core/                       # Shared infrastructure
│   │   ├── config.py               # Environment settings (Pydantic)
│   │   ├── exceptions.py           # Custom exception classes
│   │   └── logging.py              # Structlog configuration
│   │
│   ├── database/
│   │   ├── base.py                 # SQLAlchemy declarative base
│   │   └── connection.py           # Async engine + session factory
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── user.py, role.py
│   │   ├── conversation.py, memory.py
│   │   ├── mood.py, journal.py
│   │   ├── crisis.py, document.py
│   │   └── sentiment.py
│   │
│   ├── prompts/                    # Prompt templates (never in business logic)
│   │   ├── system_prompt.py
│   │   ├── cbt_prompt.py
│   │   ├── crisis_prompt.py
│   │   ├── journal_prompt.py
│   │   ├── guardrail_prompt.py
│   │   └── summary_prompt.py
│   │
│   ├── repositories/               # Database access layer
│   ├── schemas/                    # Pydantic request/response models
│   ├── security/                   # JWT + password hashing
│   ├── services/                   # Business logic layer
│   └── main.py                     # FastAPI app + lifespan
│
├── tests/                          # Pytest test suites
├── alembic/                        # Database migrations
├── .env                            # Local environment variables
├── .env.example                    # Template for environment variables
├── requirements.txt
├── pyproject.toml
└── alembic.ini
```

---

## Installation Guide

### Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.13+ | https://python.org |
| PostgreSQL | 17+ | https://postgresql.org |
| Ollama | Latest | https://ollama.ai |
| Groq API Key | Free | https://console.groq.com |
| Git | Any | https://git-scm.com |

---

### Step 1 — Clone the Repository

```bash
git clone <your-github-repo-url>
cd "Emora A"
```

---

### Step 2 — Create & Activate Virtual Environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

---

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 4 — Set Up PostgreSQL

1. Open **pgAdmin** or **psql**.
2. Create a new database:

```sql
CREATE DATABASE emora_db;
```

3. Make sure your `pg_hba.conf` allows local trust connections, or set a password in `.env`.

---

### Step 5 — Set Up Ollama (for RAG Embeddings)

Download and install Ollama from https://ollama.ai, then pull the embedding model:

```bash
ollama pull nomic-embed-text
```

> ✅ Ollama must be running (`ollama serve`) before using the document upload or RAG search endpoints.

---

### Step 6 — Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Variables](#environment-variables) section below).

---

### Step 7 — Run the Server

```bash
python -m uvicorn app.main:app --reload
```

The server will:
- ✅ Auto-create all database tables on first startup
- ✅ Seed default roles (User, Counselor, Admin)
- ✅ Be available at **http://127.0.0.1:8000**
- ✅ Show Swagger UI at **http://127.0.0.1:8000/docs**

---

## Environment Variables

Copy `.env.example` to `.env` and fill in these values:

```env
# Application
APP_NAME="Emora Mental Health Chatbot"
APP_VERSION="1.0.0"
DEBUG=True
SECRET_KEY=your-very-secret-key-here-change-this

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Database
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/emora_db

# Groq API
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

# Ollama (local embeddings)
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text

# ChromaDB (vector store)
CHROMA_PERSIST_DIR=./chroma_data

# File uploads
UPLOAD_DIR=./uploads
```

> 🔑 Get your free Groq API key at: https://console.groq.com

---

## API Endpoints

All endpoints are documented at **http://127.0.0.1:8000/docs**.

| Module | Prefix | Key Endpoints |
|---|---|---|
| **Health** | `/health` | `GET /health` — server status check |
| **Auth** | `/api/v1/auth` | `POST /register`, `POST /login` |
| **Users** | `/api/v1/users` | `GET /me`, `PUT /me`, admin CRUD |
| **Chat** | `/api/v1/chat` | `POST /` (new), `POST /{id}/messages` (stream), history, delete |
| **Messages** | `/api/v1/messages` | `GET /`, `GET /{id}`, `DELETE /{id}` |
| **Mood** | `/api/v1/mood` | `POST /log`, `GET /history`, `GET /trends` |
| **Journal** | `/api/v1/journal` | `POST /` (AI analysis), `GET /history`, `GET /{id}`, `DELETE /{id}` |
| **Crisis** | `/api/v1/crisis` | `GET /incidents`, `GET /incidents/{id}`, `PUT /incidents/{id}/resolve` |
| **Documents** | `/api/v1/documents` | `POST /upload`, `GET /`, `DELETE /{id}` |
| **RAG** | `/api/v1/rag` | `GET /search?q=...` |

---

## Agentic AI Pipeline

Every chat message passes through 13 specialized LangGraph agents:

```
[1] Guardrail Agent       → Blocks prompt injection, jailbreaks, PII requests
[2] Intent Agent          → Classifies: greeting / mood / journal / cbt / crisis / advice
[3] Sentiment Agent       → Detects: Happiness / Sadness / Anxiety / Stress / Burnout...
[4] Crisis Agent          → Levels: None / Low / Medium / High / Critical
[5] Memory Agent          → Loads short-term + long-term conversation context
[6] RAG Retrieval Agent   → Searches ChromaDB for relevant knowledge chunks
[7] Router Agent          → Selects the right specialist agent
    ├── [8] CBT Agent           → CBT exercises and cognitive reframing
    ├── [9] Journaling Agent    → Reflective journaling assistance
    ├── [10] Mood Agent         → Mood acknowledgment and logging guidance
    └── [11] Conversation Agent → General empathetic dialogue
[12] Validation Agent     → Removes medical advice / hallucinations from output
[13] Generator Agent      → Streams the final response token by token
```

If **High** or **Critical** crisis is detected, the pipeline short-circuits to immediately return emergency hotline information and log an incident for counselor review.

---

## RAG System

Administrators can upload mental health resources:
- **Supported formats:** PDF, DOCX, TXT, Markdown
- **Process:** Upload → Extract Text → Chunk (500 tokens / 50 overlap) → Embed via Ollama → Store in ChromaDB
- **Search:** Semantic similarity search returns top-N chunks with source citations
- **Used in:** Every chat response is augmented with relevant knowledge base content when available

---

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `users` | User accounts, profile, preferences |
| `roles` | User/Counselor/Admin |
| `conversations` | Chat session metadata |
| `messages` | Individual chat messages (role, content, sentiment, intent) |
| `memories` | Long-term conversation summaries |
| `mood_logs` | Daily mood entries with notes |
| `journal_entries` | Journals with AI summary, emotions, keywords |
| `sentiment_logs` | Per-message emotion detection log |
| `incidents` | Crisis events flagged for counselor review |
| `knowledge_documents` | Uploaded knowledge base file metadata |

---

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=term-missing

# Run a specific test file
pytest tests/test_auth.py -v
```

---

## Quick Start Checklist

- [ ] Python 3.13+ installed
- [ ] PostgreSQL running + `emora_db` created
- [ ] Ollama installed + `nomic-embed-text` pulled
- [ ] Groq API key obtained from https://console.groq.com
- [ ] `.env` configured from `.env.example`
- [ ] `pip install -r requirements.txt` done
- [ ] `python -m uvicorn app.main:app --reload` running
- [ ] Swagger UI open at http://127.0.0.1:8000/docs ✅

---

*Built as a Final Year Project — AI-Driven Agentic Mental Health Support Chatbot*
