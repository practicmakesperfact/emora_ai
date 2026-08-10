"""
Emora Backend - API v1 Main Router
Combines all v1 sub-routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.chat import router as chat_router
from app.api.v1.mood import router as mood_router

# Versioned API router
api_router = APIRouter(prefix="/api/v1")

# Include sub-routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(chat_router)
api_router.include_router(mood_router)

