# LinguaMeet AI — Security Architecture

## Authentication

- **JWT (JSON Web Tokens)** — All API endpoints (except `/register`, `/login`, `/health`, `/api/config/public`) require a valid JWT Bearer token
- Token expiry: **24 hours** (configurable via `JWT_EXPIRE_MINUTES`)
- Tokens are signed with `JWT_SECRET` using `HS256`
- Tokens are stored in browser `localStorage` and cleared on logout

## Password Security

- All passwords hashed with **bcrypt** via `passlib[bcrypt]`
- Salt is generated per-password automatically
- No plaintext passwords are ever stored or logged
- Minimum password length: **8 characters**, enforced at validation layer

## Role-Based Access Control (RBAC)

Three roles with distinct permissions:

| Permission | Admin | Host | Participant |
|---|---|---|---|
| View all meetings | ✓ | — | — |
| Create meeting | ✓ | ✓ | — |
| Start/end meeting | ✓ | ✓ (own) | — |
| Generate AI summary | ✓ | ✓ (own) | — |
| View transcript | ✓ | ✓ | ✓ (if participant) |
| View audit logs | ✓ | ✓ (own meeting) | — |
| Manage participants | ✓ | ✓ (own) | — |
| Update action item status | ✓ | ✓ | ✓ (assigned to them) |

## Confidential Meeting Mode

When a meeting is marked confidential:
- **PIN/Passcode** required (stored as meeting attribute)
- **Participant approval queue** — host must approve each join request
- **Encrypted storage flag** — indicates transcript should be encrypted at rest
- **Session timeout** — automatic disconnect after configured inactivity period
- Full **audit trail** with every action logged
- Access is restricted to approved participants only

## API Security

- **CORS** — Configured to allow only trusted origins (`CORS_ORIGINS` env var)
- **Rate Limiting** — Via `slowapi`, configurable via `RATE_LIMIT_PER_MINUTE`
- **Input Validation** — All request bodies validated via **Pydantic schemas** before any processing
- **SQL Injection Protection** — SQLAlchemy ORM with parameterized queries throughout (no raw SQL)
- **Global Error Handler** — Returns generic 500 message; never exposes stack traces or internals to clients
- **Secure Headers** — Configured at reverse-proxy layer (e.g. nginx with `X-Frame-Options`, `Content-Security-Policy`)

## Secrets Management

- All sensitive values in **environment variables** only
- `.env` is in `.gitignore` — never committed
- Frontend code never contains API keys or secrets
- IBM credentials are read server-side only

## Audit Logging

Every significant action is recorded in `audit_logs`:

| Field | Description |
|---|---|
| user_id | Acting user |
| meeting_id | Related meeting (if applicable) |
| action | Action type (e.g. `meeting_created`, `summary_generated`) |
| details | JSON with relevant metadata |
| ip_address | Client IP (from request) |
| timestamp | UTC timestamp |

Logged actions include:
- `user_registered`
- `user_login` / `user_logout`
- `meeting_created` / `meeting_started` / `meeting_ended` / `meeting_updated` / `meeting_deleted`
- `summary_generated`
- `ai_question_asked`
- `transcript_viewed`

## Privacy

- Meeting data belongs to the meeting host and organization
- No meeting data is used for model training without explicit consent
- Recording consent dialog is shown before any audio capture begins
- Users can delete meetings and associated data

## Deployment Security Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (min 32 random characters)
- [ ] Set strong `APP_SECRET_KEY`
- [ ] Set `DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure HTTPS/TLS at reverse proxy (nginx/Caddy)
- [ ] Set `CORS_ORIGINS` to your production domain only
- [ ] Use a managed PostgreSQL service with TLS
- [ ] Rotate IBM API keys and store in secrets manager (IBM Secrets Manager / Vault)
- [ ] Enable database connection SSL
- [ ] Set up log monitoring and alerting
- [ ] Review rate limits for production load

## Security Architecture Diagram

```
User Browser (HTTPS only in production)
    ↓
React Frontend
    ↓ JWT Bearer Token in Authorization header
FastAPI Backend
    ↓
┌────────────────────────────────────┐
│ JWT Verification Middleware         │
│ Role-Based Access Check (per route) │
│ Rate Limiter (slowapi)              │
│ Pydantic Input Validation           │
└────────────────────────────────────┘
    ↓
Meeting/Transcript/AI Service Logic
    ↓
PostgreSQL (bcrypt password hashes, parameterized queries)
    ↓
AuditLog (every action recorded)
```
