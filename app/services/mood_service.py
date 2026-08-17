"""
Emora Backend - Mood Service

Responsibilities:
  - Coordinate business rules and data aggregation for mood tracking.
  - Support logging, retrieving history, computing statistics, and daily averages.
  - Enforce ownership validation on deletion.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, AuthorizationException
from app.core.logging import get_logger
from app.models.mood import MoodLog
from app.repositories.mood import MoodRepository
from app.schemas.mood import (
    MoodLogCreate,
    MoodTrendsResponse,
    MoodStatSummary,
    DailyMoodAverage,
)

logger = get_logger(__name__)


class MoodService:
    """Service layer for all Mood Tracking business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = MoodRepository(db)

    async def log_mood(self, user_id: int, payload: MoodLogCreate) -> MoodLog:
        """
        Record a user's daily mood log.

        Args:
            user_id: ID of the user logging their mood.
            payload: Mood schema containing score, emotions, and notes.

        Returns:
            The created MoodLog model instance.
        """
        mood_log = MoodLog(
            user_id=user_id,
            score=payload.score,
            mood_notes=payload.mood_notes,
            emotions=payload.emotions or [],
        )
        created_log = await self._repo.create_mood_log(mood_log)
        logger.info(
            "Mood log saved",
            user_id=user_id,
            log_id=created_log.id,
            score=created_log.score,
        )
        return created_log

    async def get_mood_history(
        self, user_id: int, period: str = "weekly"
    ) -> Sequence[MoodLog]:
        """
        Retrieve a list of mood logs for a user over a specific period.

        Args:
            user_id: ID of the user.
            period: Time window filtering: 'weekly' (7 days), 'monthly' (30 days), 'all'.

        Returns:
            List of MoodLog instances, newest first.
        """
        if period == "all":
            return await self._repo.get_by_user(user_id)

        days = 7 if period == "weekly" else 30
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).replace(tzinfo=None)
        end_date = datetime.now(timezone.utc).replace(tzinfo=None)

        # Eagerly retrieve logs in range
        logs = await self._repo.get_logs_in_date_range(user_id, start_date, end_date)
        # Reverse because repository returns them oldest first (asc), and history is expected newest first (desc)
        return list(reversed(logs))

    async def get_mood_trends(
        self, user_id: int, period: str = "weekly"
    ) -> MoodTrendsResponse:
        """
        Aggregate mood statistics and daily averages for charting trends.

        Args:
            user_id: ID of the user.
            period: Time range for trends ('weekly' = 7 days, 'monthly' = 30 days).

        Returns:
            MoodTrendsResponse containing statistics and daily averages.
        """
        days = 7 if period == "weekly" else 30
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).replace(tzinfo=None)
        end_date = datetime.now(timezone.utc).replace(tzinfo=None)

        logs = await self._repo.get_logs_in_date_range(user_id, start_date, end_date)

        if not logs:
            summary = MoodStatSummary(
                average_score=0.0,
                total_logs=0,
                emotion_frequencies={},
            )
            return MoodTrendsResponse(
                period=period,
                summary=summary,
                daily_averages=[],
            )

        # 1 — Compute average score and total count
        total_score = sum(log.score for log in logs)
        total_logs = len(logs)
        average_score = round(total_score / total_logs, 2)

        # 2 — Aggregate emotion frequencies
        emotion_counts: Dict[str, int] = {}
        for log in logs:
            if log.emotions:
                for emotion in log.emotions:
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1

        # 3 — Group logs by date for daily averages
        daily_groups: Dict[str, List[int]] = {}
        for log in logs:
            date_str = log.created_at.date().isoformat()
            if date_str not in daily_groups:
                daily_groups[date_str] = []
            daily_groups[date_str].append(log.score)

        daily_averages: List[DailyMoodAverage] = []
        # Groupings are already in chronological order because repository returns logs sorted by created_at asc
        for date_str, scores in daily_groups.items():
            daily_avg = round(sum(scores) / len(scores), 2)
            daily_averages.append(
                DailyMoodAverage(
                    date=date_str,
                    average_score=daily_avg,
                    count=len(scores),
                )
            )

        summary = MoodStatSummary(
            average_score=average_score,
            total_logs=total_logs,
            emotion_frequencies=emotion_counts,
        )

        logger.info(
            "Mood trends computed",
            user_id=user_id,
            period=period,
            total_logs=total_logs,
            average_score=average_score,
        )

        return MoodTrendsResponse(
            period=period,
            summary=summary,
            daily_averages=daily_averages,
        )

    async def delete_mood_log(self, log_id: int, user_id: int) -> None:
        """
        Delete a mood log entry, verifying ownership first.

        Args:
            log_id: Primary key of the mood log.
            user_id: ID of the authenticated user requesting deletion.

        Raises:
            NotFoundException: If the log does not exist.
            AuthorizationException: If the log belongs to a different user.
        """
        mood_log = await self._repo.get_by_id(log_id)
        if not mood_log:
            raise NotFoundException(f"Mood log with ID {log_id} not found.")

        if mood_log.user_id != user_id:
            raise AuthorizationException("You do not have permission to delete this log.")

        await self._repo.delete_mood_log(mood_log)
        logger.info("Mood log deleted", log_id=log_id, user_id=user_id)
