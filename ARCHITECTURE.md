# LinguaMeet AI — Architecture

## High-Level Architecture

```
User Browser
    ↓ HTTPS
React Frontend (Vite + React.js)
    ↓ REST + WebSocket
FastAPI Backend (Python)
    ↓
┌──────────────────────────────────────────────────┐
│  Authentication Layer (JWT + bcrypt)              │
│  Role-Based Access Control (Admin/Host/Participant)│
│  Rate Limiting (slowapi)                          │
│  Input Validation (Pydantic)                      │
└──────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────┐
│  Meeting Service Layer                            │
│  ├─ Meeting CRUD                                  │
│  ├─ Participant Management                        │
│  ├─ Transcript Storage                            │
│  └─ Audit Logging                                 │
└──────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────┐
│  Real-Time WebSocket Layer (FastAPI WebSockets)   │
│  ├─ Live Transcript Broadcast                     │
│  ├─ Translation Updates                           │
│  ├─ Speaker Identification                        │
│  └─ Participant Events                            │
└──────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────┐
│  AI Orchestration Layer                           │
│  ├─ IBM Watson Speech to Text                     │
│  ├─ IBM Watson Language Translator                │
│  ├─ IBM watsonx.ai (Granite LLM)                  │
│  └─ Demo Provider (mock data when no credentials) │
└──────────────────────────────────────────────────┘
    ↓
PostgreSQL Database
    ↓
Secure Meeting Knowledge Base
    ↓
RAG (Retrieval-Augmented Generation)
    ↓
AI Meeting Assistant (Q&A)
```

## Frontend Architecture

```
src/
├── api/            # Axios API client and per-module API methods
├── components/
│   ├── auth/       # ProtectedRoute
│   └── layout/     # AppLayout, Header, Sidebar
├── context/        # AuthContext (user state, demo mode)
├── pages/          # One file per route/page
├── styles/         # global.css (CSS variables, component classes)
└── App.jsx         # Router configuration
```

## Backend Architecture

```
backend/app/
├── main.py          # FastAPI app, middleware, router registration
├── config.py        # Settings (env vars, IBM credentials, demo mode)
├── auth/auth.py     # JWT, bcrypt, get_current_user dependency
├── database/
│   ├── database.py  # SQLAlchemy engine and session
│   └── init_db.py   # Table creation + demo data seeding
├── models/models.py # SQLAlchemy ORM models
├── schemas/schemas.py # Pydantic request/response schemas
├── routers/
│   ├── auth.py      # POST /register, /login, /logout, GET/PUT /me
│   ├── meetings.py  # Meeting CRUD, start/end, participants
│   ├── transcript.py # Transcript, summary, decisions, actions, Q&A
│   ├── search.py    # Global search, dashboard insights
│   └── websocket.py # WebSocket meeting room manager
├── ai/
│   ├── ai_orchestrator.py  # Live IBM Watson + watsonx.ai provider
│   └── demo_provider.py    # Mock AI provider for demo mode
└── services/
    └── audit_service.py    # Audit log helper
```

## AI Pipeline (IBM Services)

```
Microphone Audio
    ↓
Browser Web Speech API / IBM Watson STT
    ↓
Transcript Segment (text + confidence)
    ↓
Speaker Diarization (speaker_id assignment)
    ↓
IBM Watson Language Translator
    ↓
Translated Text (per participant language)
    ↓
WebSocket Broadcast → All Participants
    ↓
[Meeting Ends]
    ↓
IBM watsonx.ai (Granite 13B)
    ↓
Executive Summary + Key Points + Decisions + Action Items
    ↓
PostgreSQL Storage (summaries, decisions, action_items tables)
    ↓
RAG Knowledge Base (meeting_embeddings table)
    ↓
Post-meeting Q&A (grounded, no hallucination)
```

## Demo Mode vs Live Mode

When IBM credentials are **not** configured (or `DEMO_MODE=true`):
- `DemoAIProvider` is used instead of `AIOrchestrator`
- All AI responses use pre-written, clearly labeled demo data
- Demo mode banner is shown in the UI

When IBM credentials are configured and `DEMO_MODE=false`:
- `AIOrchestrator` routes to live IBM services
- Real STT, translation, and watsonx.ai are used

## Database Schema

See [`models/models.py`](backend/app/models/models.py) for full schema.

Key tables: `users`, `meetings`, `participants`, `transcript_segments`, `summaries`, `decisions`, `action_items`, `audit_logs`, `meeting_documents`, `meeting_embeddings`

## Security Architecture

See [SECURITY.md](SECURITY.md) for full security details.
