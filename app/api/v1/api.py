from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.chat import router as chat_router
from app.api.v1.messages import router as messages_router
from app.api.v1.mood import router as mood_router
from app.api.v1.journal import router as journal_router
from app.api.v1.crisis import router as crisis_router
from app.api.v1.documents import router as documents_router
from app.api.v1.rag import router as rag_router

# Versioned API router
api_router = APIRouter(prefix="/api/v1")

# Include sub-routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(chat_router)
api_router.include_router(messages_router)
api_router.include_router(mood_router)
api_router.include_router(journal_router)
api_router.include_router(crisis_router)
api_router.include_router(documents_router)
api_router.include_router(rag_router)
