

# BioSage – Multi-Agent Clinical Reasoning System

*Repository overview • local dev quickstart • API docs • architecture • ops & security*

> **Monorepo structure:** AI (reasoning & RAG) + Backend (patient/case CRUD & orchestration) + Frontend (Vite/React dashboard). AI exposes a small FastAPI for diagnosis, Backend exposes a broader FastAPI REST API (prefixed `/api/v1`), Frontend calls both.

---

## Table of Contents

* [At a glance](#at-a-glance)
* [Project layout](#project-layout)
* [Features](#features)
* [Architecture](#architecture)

  * [AI service (Reasoning & RAG)](#ai-service-reasoning--rag)
  * [Backend service (Data & Orchestration)](#backend-service-data--orchestration)
  * [Frontend app (Vite + React + TS)](#frontend-app-vite--react--ts)
* [Quickstart (Local Dev)](#quickstart-local-dev)
* [Configuration](#configuration)
* [APIs](#apis)

  * [AI API](#ai-api)
  * [Backend API](#backend-api)
* [Data & Storage](#data--storage)
* [Testing](#testing)
* [Security & PHI](#security--phi)
* [Troubleshooting](#troubleshooting)
* [Roadmap ideas](#roadmap-ideas)
* [License](#license)

---

## At a glance

* **AI:** FastAPI (`biosage/app/main.py`) orchestrates specialist agents (`infectious`, `autoimmune`, `cardiology`, `neurology`, `oncology`, `toxicology`) using an **LLM** (OpenAI by default), a **hybrid retriever** (FAISS dense + BM25 sparse) over a local literature corpus, a lightweight **knowledge graph**, and a **casebase**. Results are fused and returned with recommendations + citations.
* **Backend:** FastAPI (`Backend/app/main.py`) with MongoDB (Motor) for **patients, cases, vitals/labs, history, orders, research, analysis, onboarding**. Routes are under **`/api/v1`**. Includes **dummy data ingestion**.
* **Frontend:** Vite + React + TypeScript + shadcn/ui. API layer in `src/services/api.ts` points to **Backend (`http://127.0.0.1:8000/api/v1`)** and **AI diagnosis service (configurable)**.

---

## Project layout

```
BioSage-main/
├─ AI/
│  ├─ Dockerfile
│  ├─ docker-compose.yml        # runs the AI API on :8009
│  └─ biosage/
│     ├─ app/main.py            # FastAPI entrypoint for AI diagnosis endpoints
│     ├─ agents/                # specialist agents
│     │  ├─ infectious.py, autoimmune.py, cardiology.py, neurology.py, oncology.py, toxicology.py, integrator.py
│     ├─ core/
│     │  ├─ orchestrator.py     # master pipeline (normalize → retrieve → reason → fuse → recommend)
│     │  ├─ vectorstore.py      # FAISS + BM25; ingest/search over /data/literature/*.jsonl
│     │  ├─ evidence.py         # evidence capture & persistence hooks
│     │  ├─ kg.py               # small knowledge-graph + heuristics
│     │  ├─ casebase.py         # retrieve similar past cases
│     │  ├─ normalize.py        # symptom normalization
│     │  ├─ terminology.py      # synonym maps (e.g., symptom_map.csv)
│     │  ├─ prompts.py          # LLM prompts (reasoning & JSON outputs)
│     │  ├─ redact.py           # PHI redaction before LLM calls
│     │  ├─ llm.py, embeddings.py
│     │  └─ schemas.py, transform.py, scoring.py, clarify.py, recommendations.py
│     ├─ data/
│     │  ├─ literature/         # *.jsonl corpus chunks
│     │  └─ terminology/        # symptom_map.csv
│     ├─ .env.example
│     ├─ requirements.txt
│     └─ README.md              # AI-only readme (deep dive)
│
├─ Backend/
│  ├─ app/
│  │  ├─ main.py                # FastAPI entrypoint; routers mounted at /api/v1
│  │  ├─ db/                    # motor connection + CRUD shims
│  │  ├─ routes/                # users, patients, cases, vitals_labs, history, orders, analysis, research, onboarding
│  │  └─ models/                # pydantic models & enums
│  ├─ scripts/ingest_dummy_data.py
│  ├─ run_data_ingestion.py
│  ├─ requirements.txt
│  └─ test_api.py, tests/
│
└─ Frontend/
   ├─ package.json
   ├─ src/
   │  ├─ pages/                  # Dashboard, PatientOnboarding, CaseView, DiagnosisResult, EvidenceExplorer, etc.
   │  ├─ components/             # shadcn/ui primitives + app components
   │  └─ services/api.ts        # typed client to Backend + AI
   └─ vite config, tsconfig, etc.
```

---

## Features

* **Multi-agent differential**: per-specialty candidate lists with rationales, citation spans, and KG paths; then **integration** selects Top-N and a **single next-best test**.
* **Hybrid retrieval**: FAISS dense vectors + BM25 token search over `/AI/biosage/data/literature/*.jsonl`.
* **Casebase retrieval**: k-NN over prior cases to surface similar trajectories.
* **Terminology normalization**: symptom synonym map and lightweight NER mapping.
* **PHI-aware prompting**: **redaction** before LLM; strict JSON parsing on outputs.
* **Backend data model**: patients, cases, vitals, labs, histories, orders, research suggestions/trials, audit logs, agent runs, integrated results, feedback.
* **Frontend UX**: onboarding → vitals/labs → agent results → fused differential → evidence explorer → orders & research suggestions.

---

## Architecture

### AI service (Reasoning & RAG)

**Flow (`orchestrator.py` → `app/main.py` POST `/diagnose`):**

1. **Input** `PatientData` → `transform.py` → `Intake`

   * Extract **demographics** (age/sex), **vitals**, **free-text symptoms**, **labs**.
2. **Normalize** symptoms + codes (`normalize.py`, `terminology.py`).
3. **Retrieve**:

   * **Literature** hybrid search (`vectorstore.py`): BM25 + FAISS over JSONL corpus.
   * **Casebase** (`casebase.py`): nearest past cases.
   * **KG** snippets (`kg.py`): short path explanations.
4. **Reason** (per agent): `agents/*.py` use `llm.py` with prompts from `prompts.py`, returning **strict JSON** candidates `{diagnosis, rationale, citations, graph_paths, score}`.
5. **Fuse**: `agents/integrator.py` aggregates candidates, computes **agreement**, and selects **Top-5** differential + **next-best test**.
6. **Recommend**: `recommendations.py` adds 3–6 actionable steps.
7. **Persist evidence**: `evidence.py` (inputs, normalized symptoms, retrieval hits, agent outputs, fused result).

**Models & Providers (`llm.py`, `embeddings.py`):**

* Default **OpenAI** (`gpt-4o` for reasoning, `text-embedding-3-large` for embeddings).
* Azure / local vLLM toggles are present via envs.

### Backend service (Data & Orchestration)

* **FastAPI** with **Motor** (async MongoDB) and Pydantic models.
* Routes under **`/api/v1`**:

  * `users`, `patients`, `cases`, `vitals_labs`, `history`, `orders`, `research`, `onboarding`, and **analysis** (agents status/results, feedback, audit logs, system events).
* **Startup/Shutdown** connect/close Mongo (`app/db/connection.py`).
* **Dummy data ingestion** (`run_data_ingestion.py` → `scripts/ingest_dummy_data.py`) to populate realistic records for testing.

### Frontend app (Vite + React + TS)

* **UI** via shadcn/ui components, typed API client in `src/services/api.ts`.
* Pages include **Dashboard**, **PatientOnboarding**, **CaseView**, **DiagnosisProgress/Result**, **EvidenceExplorer**, **SpecialistGrid**, **Orders/Tests**, **ResearchHub**, **AdminAudit**.

---

## Quickstart (Local Dev)

> Prereqs: **Python 3.11+**, **Node 18+/PNPM or NPM**, **MongoDB** (local or Atlas), **OpenAI API key** (or Azure/vLLM).

### 1) Run the AI diagnosis API

```bash
cd AI
cp biosage/.env.example biosage/.env
# edit biosage/.env:
#   OPENAI_API_KEY=sk-...
#   (optional) REAS_PROVIDER/EMBED_PROVIDER, Azure or vLLM settings, etc.

# Option A: Docker (published as :8009)
docker compose up --build

# Option B: Local Python
cd biosage
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn biosage.app.main:app --host 0.0.0.0 --port 8009
```

### 2) Run the Backend API (MongoDB required)

```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# set Mongo creds (prefer .env)
export MONGO_URI="mongodb://localhost:27017"
export MONGO_DB="biosage"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

* Optional: seed dummy data

  ```bash
  python run_data_ingestion.py
  ```

### 3) Run the Frontend

```bash
cd Frontend
# npm i  OR  pnpm i
npm install
npm run dev
```

> **Important:** Frontend calls two bases (see `src/services/api.ts`):
>
> * **Backend:** `http://127.0.0.1:8000/api/v1`
> * **AI Diagnosis:** `DIAGNOSIS_BASE_URL` (currently an ngrok URL in code).
>   Set this to your local AI server, e.g. `http://127.0.0.1:8009`.

---

## Configuration

### AI (`AI/biosage/.env`)

```
OPENAI_API_KEY=...
APP_ENV=dev
OPENAI_REAS_MODEL=gpt-4o
OPENAI_EMBED_MODEL=text-embedding-3-large

# Provider selection
REAS_PROVIDER=openai
EMBED_PROVIDER=openai

# Azure (if used)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_REAS_DEPLOYMENT=gpt-4o
AZURE_EMBED_DEPLOYMENT=text-embedding-3-large

# Local vLLM (BioGPT, etc.)
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_REAS_MODEL=microsoft/BioGPT-Large
VLLM_EMBED_MODEL=microsoft/BioGPT-Large
```

Additional AI envs supported via `docker-compose.yml` include Mongo persistence knobs and CORS (`CORS_ORIGINS=*`).

### Backend (env variables)

Core variables read in `app/db/connection.py`:

* `MONGO_URI` (connection string)
* `MONGO_DB` (default `biosage`)
* `MONGO_TLS_INSECURE`, `MONGO_CONNECT_TIMEOUT_MS`, `MONGO_SOCKET_TIMEOUT_MS` (optional)

> **Security note:** replace any hard-coded Atlas URI with env-only, and never commit real credentials.

### Frontend

Currently constants are in `src/services/api.ts`:

```ts
const BASE_URL = 'http://127.0.0.1:8000/api/v1'
const DIAGNOSIS_BASE_URL = 'http://127.0.0.1:8009' // <- set this locally
```

If you prefer runtime config, switch to `import.meta.env.VITE_*` variables.

---

## APIs

### AI API

Base (if using docker-compose): `http://127.0.0.1:8009`

#### POST `/diagnose`

Runs the full multi-agent pipeline.

**Request shape** (`PatientData`, see `core/schemas.py`):

```json
{
  "patient": { "name": "Jane Doe", "gender": "female", "mrn": "A123" },
  "case":   { "case_id": "case-001", "chief_complaint": "fever and chills" },
  "vitals": { "temperature": 102.5, "hr": 110, "bp_sys": 118, "bp_dia": 74, "spo2": 96 },
  "labs":   [{ "name": "WBC", "value": 12.5, "unit": "10^9/L" }, { "name": "CRP", "value": 45, "unit": "mg/L" }],
  "medical_history": { "conditions": ["asthma"], "allergies": [], "medications": [] },
  "social_history":  { "smoking": "never", "alcohol": "social" }
}
```

**Response (abridged)**:

```json
{
  "differential_top": [
    { "diagnosis": "Dengue fever", "score": 0.84,
      "rationale": "...", "citations": [{ "doc_id": "PMID:...", "span": "..." }],
      "graph_paths": [["fever","mosquito","dengue"]] }
  ],
  "next_best_test": { "name": "NS1 antigen", "why": "..." },
  "recommendations": [{ "title": "Hydration", "priority": "high", "rationale": "..." }],
  "evidence_id": "ev_abc123"
}
```

#### GET `/evidence/{case_id}`

Returns persisted evidence bundle for review (normalized symptoms, retrieval hits, agent outputs, fused result).

#### GET `/cases/{patient_id}`

List AI-side cases for a patient.

#### GET `/diagnosed_result/{patient_id}`

Convenience endpoint returning latest integrated result for a patient.

---

### Backend API

Base: `http://127.0.0.1:8000/api/v1`

Routers (non-exhaustive, inferred from `app/routes`):

* **Users** `/users`
  `GET /`, `POST /`, `GET /{user_id}`, `PUT /{user_id}`, `DELETE /{user_id}`, `GET /{user_id}/profile`, `GET /roles/available`, `GET /statuses/available`

* **Patients** `/patients`
  `POST /` (create), `GET /` (list), `GET /{patient_id}`, `PUT /{patient_id}`, `DELETE /{patient_id}`

* **Cases** `/cases`
  CRUD + association with patients; endpoints to attach AI specialist/integrated results

* **Vitals & Labs** `/vitals_labs`
  `POST /cases/{case_id}/vitals`, `GET /cases/{case_id}/vitals`,
  `POST /cases/{case_id}/labs` (+ bulk), `GET /cases/{case_id}/labs`, CRUD by id

* **History** `/history`
  Medical history, social history CRUD

* **Orders** `/orders`
  Diagnostic/therapeutic orders with status & priority enums

* **Research** `/research`
  Research suggestions, clinical trials (priority, phase, status)

* **Onboarding** `/onboarding`
  Structured capture for initial patient intake

* **Analysis** `/analysis`
  Agents registry & status, recent cases per agent, specialist results, integrated results, **feedback**, **audit logs**, **system events**

* **Health**
  `GET /health`, `GET /status`, `GET /dashboard/metrics` (from `app/main.py`)

*All routers are mounted with prefix `/api/v1` via `app.include_router(..., prefix="/api/v1")`.*

---

## Data & Storage

* **MongoDB** (Motor Async) stores users, patients, cases, vitals, labs, histories, orders, research data, audit & system events, agent outputs, integrated results, and feedback.
* **AI Retrieval Corpora** live under `AI/biosage/data/literature/*.jsonl`.
* **Vector store** (FAISS index + meta) is created under `AI/biosage/storage/vector/` on first run (if needed).
* **Terminology** mappings in `AI/biosage/data/terminology/symptom_map.csv`.

---

## Testing

### AI

```bash
cd AI/biosage
pytest -q
```

* Includes **golden cases** in `biosage/tests/golden/*.json` to check stability of outputs (differential + citations + KG paths).

### Backend

```bash
cd Backend
pytest -q
python test_api.py   # quick liveness checks for /health, /status, /dashboard/metrics
```

---

## Security & PHI

* **Never commit real keys or database URIs.** Use `.env` files and your secret manager of choice.
* **PHI Redaction** (`AI/biosage/core/redact.py`) is applied before LLM calls; still treat all AI logs as sensitive.
* **CORS** is currently permissive during development (`*`). Lock this down in production.
* **Mongo connection**: ensure TLS, timeouts, and least-privilege roles; rotate credentials.

---

## Troubleshooting

* **Diagnosis endpoint 500s** → check `OPENAI_API_KEY` (or Azure/vLLM), and that the embeddings/FAISS build doesn’t fail (install `faiss-cpu`).
* **Frontend shows no data** → verify `src/services/api.ts` points **Backend** to `http://127.0.0.1:8000/api/v1` and **AI** to your running `http://127.0.0.1:8009`.
* **Mongo connection issues** → set correct `MONGO_URI` (local: `mongodb://localhost:27017`) and database name via `MONGO_DB`.
* **CORS** errors → add your dev origin (e.g., `http://localhost:5173`) to allowed origins in both FastAPIs.

---


