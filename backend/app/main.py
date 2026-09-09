"""LinguaMeet AI — FastAPI Application Entry Point"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.config import get_settings
from app.routers import auth, meetings, transcript, search, websocket

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("linguameet")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="LinguaMeet AI API",
    description="AI-Powered Multilingual Secure Meeting Assistant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global Error Handlers ────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(transcript.router)
app.include_router(search.router)
app.include_router(websocket.router)


# ─── Health & Info ────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "demo_mode": settings.is_demo_mode,
    }


@app.get("/api/config/public")
def public_config():
    """Return non-sensitive configuration for the frontend."""
    return {
        "app_name": settings.APP_NAME,
        "demo_mode": settings.is_demo_mode,
        "supported_languages": [
            {"code": "en", "name": "English", "native": "English"},
            {"code": "ta", "name": "Tamil", "native": "தமிழ்"},
            {"code": "hi", "name": "Hindi", "native": "हिन्दी"},
            {"code": "ml", "name": "Malayalam", "native": "മലയാളം"},
            {"code": "te", "name": "Telugu", "native": "తెలుగు"},
            {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
        ],
    }


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    logger.info(f"[START] {settings.APP_NAME} starting up")
    logger.info(f"   Mode: {'DEMO' if settings.is_demo_mode else 'LIVE'}")
    logger.info(f"   Environment: {settings.APP_ENV}")
