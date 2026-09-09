# LinguaMeet AI — API Documentation

Base URL: `http://localhost:8000`

All protected endpoints require: `Authorization: Bearer <jwt_token>`

Interactive docs: `http://localhost:8000/docs`

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 8 chars)",
  "role": "participant | host",
  "preferred_language": "en"
}
```
**Response:** `{ access_token, user }`

---

### POST /api/auth/login
Login with email and password.

**Body:** `{ email, password }`
**Response:** `{ access_token, user }`

---

### POST /api/auth/logout
Logout (invalidate on client; logs the event).
**Auth required**

---

### GET /api/auth/me
Get current user profile.
**Auth required**

---

### PUT /api/auth/me
Update name or preferred language.
**Body:** `{ name?, preferred_language? }`
**Auth required**

---

## Meetings

### GET /api/meetings
List meetings for current user (host or participant).
**Query params:** `status`, `search`

### POST /api/meetings
Create a new meeting.
**Body:**
```json
{
  "title": "string",
  "description": "string?",
  "meeting_type": "business|education|healthcare|government|conference|team_meeting|other",
  "scheduled_time": "ISO datetime?",
  "expected_duration_minutes": 60,
  "speech_language": "en",
  "participant_languages": ["en", "ta"],
  "is_confidential": false,
  "meeting_pin": "string?",
  "require_approval": false,
  "encrypted_storage": false,
  "session_timeout_minutes": null
}
```

### GET /api/meetings/:id
Get meeting by ID. Access-controlled.

### PUT /api/meetings/:id
Update meeting (host/admin only).

### DELETE /api/meetings/:id
Delete meeting (host/admin only).

### POST /api/meetings/:id/start
Start a meeting (sets status=active, records start_time).

### POST /api/meetings/:id/end
End a meeting (sets status=ended, records end_time).

---

## Participants

### GET /api/meetings/:id/participants
List all participants.

### POST /api/meetings/:id/participants
Add a participant.
**Body:** `{ user_id, role, preferred_language }`

### DELETE /api/meetings/:id/participants/:userId
Remove a participant.

---

## Transcript

### GET /api/meetings/:id/transcript
Get all transcript segments ordered by time.

### POST /api/meetings/:id/transcript
Add a transcript segment.
**Body:**
```json
{
  "speaker_id": "string",
  "speaker_name": "string?",
  "original_text": "string",
  "source_language": "en",
  "confidence": 0.95,
  "offset_seconds": 42.5,
  "translations": { "ta": "...", "hi": "..." }
}
```

---

## AI Summary & Intelligence

### GET /api/meetings/:id/summary
Get the AI-generated summary (404 if not generated yet).

### POST /api/meetings/:id/generate-summary
Trigger AI summary generation (host/admin only). Uses Demo or IBM watsonx.ai depending on config.

### GET /api/meetings/:id/decisions
Get all decisions for the meeting.

### GET /api/meetings/:id/actions
Get all action items for the meeting.

### PUT /api/meetings/action-items/:itemId
Update an action item (e.g. change status).
**Body:** `{ status?: "pending|in_progress|completed", priority?, deadline? }`

### POST /api/meetings/:id/ask
Ask AI a question about the meeting (RAG Q&A).
**Body:** `{ question: "string" }`
**Response:** `{ question, answer, sources, is_demo, confidence }`

---

## Search & Insights

### GET /api/search?q=<query>
Global search across transcripts, decisions, actions, meeting titles.
Returns up to 50 results grouped by meeting.

### GET /api/insights/dashboard
Dashboard statistics: total meetings, meetings this week, hours transcribed, languages, pending actions, confidential meetings, recent meetings.

### GET /api/action-items/my
All action items assigned to the current user.

---

## Security & Audit

### GET /api/meetings/:id/audit-logs
Full audit trail for a meeting (host/admin only).

---

## WebSocket

### WS /ws/meeting/{meeting_id}/{user_id}
Real-time meeting communication.

**Client → Server events:**
```json
{ "event": "meeting:join", "data": { "name": "..." } }
{ "event": "meeting:leave", "data": {} }
{ "event": "transcript:update", "data": { "speaker_id", "speaker_name", "text", "confidence", "translations", "offset" } }
{ "event": "speaker:update", "data": {} }
{ "event": "demo:start_stream", "data": {} }
{ "event": "ping", "data": {} }
```

**Server → Client events:**
```json
{ "event": "meeting:status", "data": { "participant_count", "timestamp" } }
{ "event": "transcript:update", "data": { ... } }
{ "event": "participant:joined", "data": { "user_id", "count" } }
{ "event": "participant:left", "data": { "user_id", "count" } }
{ "event": "notification:update", "data": { "message", "type" } }
{ "event": "pong", "data": {} }
```

---

## Config

### GET /api/config/public
Returns non-sensitive app config: `app_name`, `demo_mode`, `supported_languages`.

### GET /health
Health check.
