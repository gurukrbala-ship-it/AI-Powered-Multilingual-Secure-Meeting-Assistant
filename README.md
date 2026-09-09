# LinguaMeet AI — Secure AI-Powered Multilingual Meeting Assistant

## Project Overview

LinguaMeet AI is a production-grade AI meeting intelligence platform that eliminates language barriers in meetings while automatically converting spoken conversations into searchable knowledge.

**Core Pipeline:** Speech → Transcribe → Speaker ID → Translate → Summarize → Extract Actions → Ask AI → Secure

---

## Problem Statement

In global teams, language barriers prevent effective communication. After meetings, knowledge is lost — no structured summaries, no action tracking, no way to search what was discussed.

## Solution

LinguaMeet AI provides:
- Real-time multilingual speech-to-text and translation
- Automatic AI-generated summaries, decisions and action items
- Searchable meeting knowledge base with AI Q&A
- Confidential meeting mode with security controls and audit logs

---

## Features

- 🎙️ Real-time speech-to-text (IBM Watson STT / Whisper)
- 🌐 Multilingual translation (IBM Watson Language Translator)
- 👤 Speaker diarization
- 🤖 AI meeting summarization (IBM watsonx.ai)
- 📋 Action item extraction and tracking
- 💬 Post-meeting AI Q&A (RAG architecture)
- 🔐 Confidential meeting mode
- 📊 Meeting analytics and insights
- 🔍 Global meeting search
- 📱 Responsive design

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, JavaScript, Bootstrap 5 |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Real-time | WebSockets (FastAPI) |
| AI/ML | IBM watsonx.ai, IBM Watson STT, IBM Watson LT |
| Auth | JWT, bcrypt |

---

## Architecture

```
User Browser
    ↓
React Frontend (Vite)
    ↓
FastAPI Backend
    ↓
┌─────────────────────────────────────┐
│ Auth Layer (JWT + RBAC)             │
│ Meeting Service                     │
│ WebSocket Layer (Real-time)         │
│ AI Orchestration Layer              │
│   ├── SpeechRecognitionService      │
│   ├── TranslationService            │
│   ├── SpeakerDiarizationService     │
│   ├── SummarizationService          │
│   ├── ActionItemService             │
│   ├── MeetingQAService (RAG)        │
│   └── EmbeddingService             │
└─────────────────────────────────────┘
    ↓
PostgreSQL Database
```

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd linguameet/backend

# (Optional) create a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate      # Linux/Mac

pip install -r requirements.txt

# Copy environment config (SQLite by default — works with zero setup)
cp ../.env.example .env

# Create database tables and seed demo data
python -m app.database.init_db

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

> **Zero-config start:** The default `DATABASE_URL=sqlite:///./linguameet.db` works immediately without PostgreSQL.
> For production, change to `postgresql://user:password@host:5432/linguameet`.

### Frontend Setup
```bash
cd linguameet/frontend
npm install
cp .env.example .env.local
# Edit .env.local

npm run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT tokens
- `IBM_STT_API_KEY` — IBM Watson Speech to Text API key
- `IBM_TRANSLATOR_API_KEY` — IBM Watson Language Translator API key
- `WATSONX_API_KEY` — IBM watsonx.ai API key
- `WATSONX_PROJECT_ID` — IBM watsonx.ai project ID
- `DEMO_MODE` — Set `true` to run with mock AI providers

---

## Demo Mode

When `DEMO_MODE=true`, the application uses simulated AI responses:
- Pre-loaded sample meeting with Arun, Priya, Rahul
- Simulated transcript, translation, summary, and action items
- AI Q&A returns grounded answers from demo meeting data

Demo data is clearly labeled in the UI.

---

## IBM Service Configuration

### IBM Watson Speech to Text
1. Create an STT instance on IBM Cloud
2. Copy API key and URL to `.env`
3. Set `DEMO_MODE=false`

### IBM Watson Language Translator
1. Create a Language Translator instance on IBM Cloud
2. Copy API key and URL to `.env`

### IBM watsonx.ai
1. Create a watsonx.ai project on IBM Cloud
2. Copy API key, Project ID, and URL to `.env`

---

## Database Setup

```bash
cd backend

# Create tables and seed demo data
python -m app.database.init_db
```

This creates all tables and seeds the demo meeting with Arun, Priya, and Rahul.

Demo credentials:
- `arun@linguameet.demo` / `Demo@1234` (Meeting Host)
- `priya@linguameet.demo` / `Demo@1234` (Participant - Tamil)
- `rahul@linguameet.demo` / `Demo@1234` (Participant - Hindi)
- `admin@linguameet.demo` / `Admin@1234` (Admin)

---

## API Documentation

- Interactive docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- See [API.md](API.md) for full endpoint reference

---

## Security Architecture

See [SECURITY.md](SECURITY.md)

---

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

---

## Deployment

See [ARCHITECTURE.md](ARCHITECTURE.md) for deployment on IBM Cloud.

---

## License

MIT License — For demonstration and educational purposes.
