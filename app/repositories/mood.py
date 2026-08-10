"""
Emora Backend - Mood Repository

Responsibilities:
  - Perform CRUD database operations for the MoodLog model.
  - Eager load relationships if required.
  - Isolate SQLAlchemy operations from business logic.
"""

from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.mood import MoodLog

logger = get_logger(__name__)


class MoodRepository:
    """Repository for managing MoodLog database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_mood_log(self, mood_log: MoodLog) -> MoodLog:
        """
        Persist a new MoodLog instance.

        Args:
            mood_log: The instantiated MoodLog model.

        Returns:
            The saved and refreshed MoodLog ORM model.
        """
        self.db.add(mood_log)
        await self.db.flush()
        await self.db.refresh(mood_log)
        logger.debug(
            "Mood log created",
            log_id=mood_log.id,
            user_id=mood_log.user_id,
            score=mood_log.score,
        )
        return mood_log

    async def get_by_id(self, log_id: int) -> Optional[MoodLog]:
        """
        Retrieve a single MoodLog by primary key.

        Args:
            log_id: Primary key of the mood log.

        Returns:
            MoodLog ORM instance if found, else None.
        """
        result = await self.db.execute(
            select(MoodLog).where(MoodLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[MoodLog]:
        """
        Fetch mood logs for a user, sorted by creation date (newest first).

        Args:
            user_id: ID of the user.
            skip: Pagination offset.
            limit: Maximum logs to retrieve.

        Returns:
            List of MoodLog instances.
        """
        result = await self.db.execute(
            select(MoodLog)
            .where(MoodLog.user_id == user_id)
            .order_by(MoodLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_logs_in_date_range(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> Sequence[MoodLog]:
        """
        Fetch all mood logs for a user created within a specific date range.

        Useful for weekly and monthly trend aggregations.

        Args:
            user_id: ID of the user.
            start_date: Start of the datetime range.
            end_date: End of the datetime range.

        Returns:
            List of MoodLog instances within the range, sorted by creation date asc.
        """
        result = await self.db.execute(
            select(MoodLog)
            .where(
                MoodLog.user_id == user_id,
                MoodLog.created_at >= start_date,
                MoodLog.created_at <= end_date,
            )
            .order_by(MoodLog.created_at.asc())
        )
        return result.scalars().all()

    async def delete_mood_log(self, mood_log: MoodLog) -> None:
        """
        Delete a mood log from the database.

        Args:
            mood_log: MoodLog ORM instance to remove.
        """
        await self.db.delete(mood_log)
        await self.db.flush()
        logger.debug("Mood log deleted from repository", log_id=mood_log.id)
