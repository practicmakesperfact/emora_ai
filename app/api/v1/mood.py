"""
Emora Backend - Mood API Router

Routes:
  POST   /api/v1/mood           - Record a daily mood log
  GET    /api/v1/mood/history   - Retrieve weekly/monthly mood history list
  GET    /api/v1/mood/trends    - Retrieve mood statistics and averages for trends
  DELETE /api/v1/mood/{log_id}  - Delete a specific mood log entry

All endpoints require authentication (Bearer token).
"""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.schemas.mood import MoodLogCreate, MoodLogOut, MoodTrendsResponse
from app.services.mood_service import MoodService

logger = get_logger(__name__)

router = APIRouter(prefix="/mood", tags=["Mood"])


# ─── Record Mood Log ──────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=MoodLogOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record a daily mood log",
    description="Save a new daily mood score (1-10) with optional emotions and notes.",
)
async def log_mood(
    payload: MoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MoodLogOut:
    """Record a user's daily mood log."""
    service = MoodService(db)
    mood_log = await service.log_mood(user_id=current_user.id, payload=payload)
    return mood_log


# ─── Mood History ─────────────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=List[MoodLogOut],
    status_code=status.HTTP_200_OK,
    summary="Retrieve mood history",
    description="Fetch a list of mood logs over a given period (weekly, monthly, or all).",
)
async def get_mood_history(
    period: str = Query(
        default="weekly",
        description="Filter range: 'weekly' (last 7 days), 'monthly' (last 30 days), or 'all'",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[MoodLogOut]:
    """Retrieve mood logs history for the authenticated user."""
    # Normalize input
    period_lower = period.lower().strip()
    if period_lower not in ["weekly", "monthly", "all"]:
        period_lower = "weekly"

    service = MoodService(db)
    history = await service.get_mood_history(user_id=current_user.id, period=period_lower)
    return list(history)


# ─── Mood Trends ──────────────────────────────────────────────────────────────

@router.get(
    "/trends",
    response_model=MoodTrendsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve mood trends",
    description="Fetch aggregated statistics and daily averages for charting trends (weekly or monthly).",
)
async def get_mood_trends(
    period: str = Query(
        default="weekly",
        description="Trends range: 'weekly' (last 7 days) or 'monthly' (last 30 days)",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MoodTrendsResponse:
    """Retrieve aggregated mood trends for charting."""
    period_lower = period.lower().strip()
    if period_lower not in ["weekly", "monthly"]:
        period_lower = "weekly"

    service = MoodService(db)
    trends = await service.get_mood_trends(user_id=current_user.id, period=period_lower)
    return trends


# ─── Delete Mood Log ──────────────────────────────────────────────────────────

@router.delete(
    "/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a mood log entry",
    description="Delete a mood log entry. User must own the entry.",
)
async def delete_mood_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a mood log entry belonging to the authenticated user."""
    service = MoodService(db)
    await service.delete_mood_log(log_id=log_id, user_id=current_user.id)
