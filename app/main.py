"""
Emora Backend - FastAPI Application Entry Point

Responsibilities:
  - Initialize and configure the FastAPI app instance
  - Configure CORS middleware
  - Register custom exception handlers
  - Mount API routers
  - Handle startup events (logging setup, DB seeding)
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import get_logger, setup_logging
from app.database.base import Base
from app.database.connection import engine
from app.models import conversation, crisis, document, journal, memory, mood, notification, sentiment, user  # noqa: F401 - ensures all models are registered

logger = get_logger(__name__)


# ─── Startup / Shutdown ───────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Runs startup logic before yielding, and teardown after.
    """
    # ── Startup ──────────────────────────────────────────────────────
    setup_logging(debug=settings.DEBUG)
    logger.info("Starting Emora Backend", version=settings.APP_VERSION)

    # Auto-create all database tables (local dev convenience).
    # In a more formal flow you would run: alembic upgrade head
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created / verified.")

    # Seed default roles
    await _seed_roles()
    logger.info("Emora Backend is ready.")

    yield  # Application runs here

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info("Emora Backend shutting down.")
    await engine.dispose()


async def _seed_roles() -> None:
    """
    Ensure the three required roles (User, Counselor, Admin) exist in the DB.
    This is idempotent — runs every startup but only inserts missing roles.
    """
    from sqlalchemy import select
    from app.database.connection import AsyncSessionLocal
    from app.models.user import Role

    default_roles = [
        Role(name="User", description="Regular application user"),
        Role(name="Counselor", description="Mental health counselor with elevated access"),
        Role(name="Admin", description="System administrator with full access"),
    ]

    async with AsyncSessionLocal() as session:
        try:
            for role in default_roles:
                result = await session.execute(select(Role).where(Role.name == role.name))
                exists = result.scalar_one_or_none()
                if not exists:
                    session.add(role)
                    logger.info("Seeded role", role=role.name)
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Failed to seed roles", error=str(e))


# ─── Application Factory ──────────────────────────────────────────────────────

def create_application() -> FastAPI:
    """
    Construct and configure the FastAPI application instance.

    Returns:
        Configured FastAPI application.
    """
    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AI-Driven Agentic Mental Health Support Chatbot Backend. "
            "This system provides empathetic AI-powered support, "
            "CBT guidance, mood tracking, journaling assistance, and crisis detection. "
            "⚠️ This is an AI assistant — NOT a licensed mental health professional."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ───────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Custom Exception Handlers ─────────────────────────────────────
    @application.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """Map all custom AppException subclasses to proper HTTP responses."""
        logger.warning(
            "Application error",
            path=request.url.path,
            status_code=exc.status_code,
            message=exc.message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.message,
                "details": exc.details,
            },
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Catch-all for any unhandled exceptions to prevent leaking stack traces."""
        logger.error(
            "Unhandled exception",
            path=request.url.path,
            error=str(exc),
            exc_info=exc,
        )
        return JSONResponse(
            status_code=500,
            content={"error": "An internal server error occurred. Please try again later."},
        )

    # ── API Routers ───────────────────────────────────────────────────
    application.include_router(api_router)

    # ── Health Check ──────────────────────────────────────────────────
    @application.get("/health", tags=["Health"], summary="Health check endpoint")
    async def health_check() -> dict:
        """Returns a simple health status for monitoring and load balancer pings."""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }

    return application


# ─── App Instance ─────────────────────────────────────────────────────────────

app = create_application()
