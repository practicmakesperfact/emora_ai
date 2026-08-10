"""
Emora Backend - Journal API Router

Routes:
  POST   /api/v1/journal             - Save a daily journal entry (runs AI analysis)
  GET    /api/v1/journal/history     - Retrieve history of journal entries
  GET    /api/v1/journal/{journal_id} - Retrieve details of a specific journal entry
  DELETE /api/v1/journal/{journal_id} - Delete a specific journal entry

All endpoints require authentication (Bearer token).
"""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalOut
from app.services.journal_service import JournalService

logger = get_logger(__name__)

router = APIRouter(prefix="/journal", tags=["Journal"])


# ─── Save Journal Entry ──────────────────────────────────────────────────────

@router.post(
    "",
    response_model=JournalOut,
    status_code=status.HTTP_201_CREATED,
    summary="Save a daily journal entry",
    description=(
        "Saves a new daily journal entry, automatically processes it via AI to "
        "extract summary, emotions, and keywords, and returns the analyzed entry."
    ),
)
async def create_journal_entry(
    payload: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> JournalOut:
    """Record and analyze a user's daily journal entry."""
    service = JournalService(db)
    journal_entry = await service.create_journal(user_id=current_user.id, payload=payload)
    return journal_entry


# ─── Journal History ─────────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=List[JournalOut],
    status_code=status.HTTP_200_OK,
    summary="Retrieve journal history",
    description="Fetch a list of journal entries for the authenticated user (sorted newest first).",
)
async def get_journal_history(
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum entries to retrieve"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[JournalOut]:
    """Retrieve journal entries history for the authenticated user."""
    service = JournalService(db)
    history = await service.get_journal_history(user_id=current_user.id, skip=skip, limit=limit)
    return list(history)


# ─── Get Specific Journal Entry ──────────────────────────────────────────────

@router.get(
    "/{journal_id}",
    response_model=JournalOut,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a specific journal entry",
    description="Fetch details of a specific journal entry. User must own the entry.",
)
async def get_journal_entry(
    journal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> JournalOut:
    """Retrieve a journal entry by ID."""
    service = JournalService(db)
    journal_entry = await service.get_journal_by_id(journal_id=journal_id, user_id=current_user.id)
    return journal_entry


# ─── Delete Journal Entry ────────────────────────────────────────────────────

@router.delete(
    "/{journal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a specific journal entry",
    description="Delete a journal entry by ID. User must own the entry.",
)
async def delete_journal_entry(
    journal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a journal entry by ID."""
    service = JournalService(db)
    await service.delete_journal(journal_id=journal_id, user_id=current_user.id)
