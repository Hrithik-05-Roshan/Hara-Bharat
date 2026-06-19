"""
FastAPI main application — HaraBharat Backend.
Configures CORS, rate limiting, routers, and health check.
"""

import os
from contextlib import asynccontextmanager

# pyre-ignore [missing-import]
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyre-ignore [import-error]
from slowapi.errors import RateLimitExceeded
# pyre-ignore [import-error]
from slowapi.util import get_remote_address
# pyre-ignore [import-error]
from database import init_db
# pyre-ignore [missing-import]
from routers import users, activities, insights, challenges, location
# pyre-ignore [import-error]
from services.gemini_service import chat_with_eco_mitra
# pyre-ignore [missing-import]
from schemas import ChatRequest, ChatResponse

# Load environment variables
load_dotenv()

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="HaraBharat API 🌿",
    description=(
        "Carbon Footprint Awareness Platform — "
        "Apni dharti bachao, ek kadam ek din!"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users.router)
app.include_router(activities.router)
app.include_router(insights.router)
app.include_router(challenges.router)
app.include_router(location.router)


# ─── Chat Endpoint (Rate Limited) ───

@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, data: ChatRequest):
    """
    Eco Mitra AI chatbot endpoint.
    Rate limited to 20 requests per minute per user.
    """
    from services.gemini_service import chat_with_eco_mitra_agent
    reply, intent, show_confirmation, pending_activities, new_context = await chat_with_eco_mitra_agent(
        user_message=data.message,
        user_context_str=data.user_context,
    )
    return ChatResponse(
        reply=reply,
        intent=intent,
        show_confirmation=show_confirmation,
        pending_activities=pending_activities,
        user_context=new_context
    )


# ─── Badges Endpoint ───

@app.get("/api/badges/{user_id}", tags=["Badges"])
def get_user_badges(user_id: str):
    """Get all badges for a user (unlocked and locked)."""
    from database import get_db
    from services.badge_service import get_user_badges as fetch_badges

    db = next(get_db())
    try:
        return fetch_badges(db, user_id)
    finally:
        db.close()


# ─── Health Check ───

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "HaraBharat chal raha hai! 🌿"}


# ─── Global Exception Handler ───

@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    """Catch-all exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Kuch galat ho gaya! Thodi der baad try karo.",
            "error": str(exc) if os.getenv("ENV") == "development" else None,
        },
    )
