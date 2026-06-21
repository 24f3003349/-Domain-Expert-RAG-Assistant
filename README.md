# Domain-Expert RAG Assistant (Enterprise Edition)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js 14](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**Business Problem Statement**: Enterprise organizations in regulated sectors cannot safely query proprietary documents using public LLMs due to severe risks of data leakage across user bounds, compliance hallucinations, and gateway timeouts on large files.

**Project Description**: A secure, multi-tenant RAG system built for document auditing. It allows users to query directories for answers grounded in verified source files with page-level citations, while guaranteeing absolute data privacy and zero gateway latency.

---

## 📈 System Design Objectives

The architecture is engineered to optimize for the following performance and quality targets:
*   **Context Retrieval Quality**: Maximizing context recall by combining semantic vector search, BM25 keyword search, and Cohere reranking.
*   **Minimal Hallucinations**: Reducing response hallucination by strictly grounding the LLM's prompts in retrieved document chunks.
*   **Low-Latency Streaming**: Utilizing FastAPI `StreamingResponse` to stream token deltas instantly to the client as they are generated.
*   **Decoupled Workloads**: Offloading CPU-heavy parsing and indexing workloads to Celery workers to keep web threads responsive.

---

## 💼 Core Business Use Cases

*   **⚖️ Legal Contract Review**: Instantly query thousands of active leases or NDAs to detect non-standard liability clauses.
*   **📊 Financial Risk Audit**: Ground financial analysts' search in historical SEC filings and quarterly report tables.
*   **🏥 Medical Guideline Lookup**: Provide clinical personnel with access to verified hospital policies and medical procedures.

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    User([User Browser]) <--> |HTTP / Web Stream| API[FastAPI Gateway]
    API <--> |JWT Auth / Metadatas| PG[(PostgreSQL Database)]
    API --> |File Uploads| MinIO[MinIO S3 Storage]
    API --> |Enqueue Ingestion| Redis[Redis Task Broker]
    Redis --> Worker[Celery Worker]
    Worker --> |Download & Parse| Parsing[LlamaIndex SentenceSplitter]
    Parsing --> |Embeddings nomic/gemini| ChromaDB[(Vector Database: Chroma/Pinecone)]
    API <--> |Retrieve Context & LLM Response| ChromaDB
    API <--> |Streaming Inference| LLM[Local Ollama / Google Gemini]
```

---

## ⚡ Key Engineering Solutions

*   **🔒 Tenant Data Isolation**: Enforces user-level metadata filters (`user_id == current_user`) inside vector search queries to guarantee no cross-user data leakage.
*   **⚙️ Decoupled Task Ingestion**: Offloads PDF parsing, sentence-aware chunking, and embedding generation to **Celery & Redis** background workers to keep the API gateway responsive.
*   **⚡ Cryptographic Deduplication**: Hashes file streams using SHA-256 before upload. Matches existing hashes in Postgres to prevent redundant vector storage and duplicate API fees.
*   **📑 Audit-Ready Citations**: Extracts and streams source metadata (filenames, page numbers) in real-time before text generation begins.
*   **🧪 Zero-Dependency Testing**: Features an in-memory SQLite (`sqlite+aiosqlite`) test runner with connection-level transaction rollbacks, allowing fast, isolated offline test execution.

---

## 🛠️ Tech Stack

*   **Backend**: FastAPI, Python 3.12, SQLAlchemy 2.0, Alembic
*   **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Zustand
*   **Task Queue**: Celery, Redis
*   **Storage**: PostgreSQL (metadata), ChromaDB / Pinecone (vectors), MinIO (S3-compatible)
*   **AI Engine**: LlamaIndex, Ollama, Google Gemini

---

## 🚦 Getting Started

### 1. Configure Environment
Copy `.env` file and set keys (`SECRET_KEY`, `GEMINI_API_KEY`, `PINECONE_API_KEY`):
```bash
cp infrastructure/.env.example infrastructure/.env
```

### 2. Start Services
```bash
# Start Docker (Postgres, Redis, MinIO)
cd infrastructure && docker-compose up -d

# Start Backend Gateway
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery Worker (In a new terminal)
celery -A worker.celery_app worker --loglevel=info
```

### 3. Start Frontend
```bash
cd ../frontend
npm install && npm run dev
```

---

## 🧪 Verification & Testing

Run the isolated test suite locally without Docker:
```bash
cd backend
pytest -v
```