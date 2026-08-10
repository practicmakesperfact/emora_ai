from datetime import datetime
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger
from app.models.journal import Journal

logger = get_logger(__name__)

class JournalRepository:
    """Repository for managing Journal database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_journal(self, journal: Journal) -> Journal:
        """
        Persist a new Journal instance.
        """
        self.db.add(journal)
        await self.db.flush()
        await self.db.refresh(journal)
        logger.debug(
            "Journal entry created in repository",
            journal_id=journal.id,
            user_id=journal.user_id,
        )
        return journal

    async def get_by_id(self, journal_id: int) -> Optional[Journal]:
        """
        Retrieve a single Journal entry by primary key.
        """
        result = await self.db.execute(
            select(Journal).where(Journal.id == journal_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Journal]:
        """
        Fetch journal entries for a user, sorted by creation date (newest first).
        """
        result = await self.db.execute(
            select(Journal)
            .where(Journal.user_id == user_id)
            .order_by(Journal.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_journal(self, journal: Journal) -> None:
        """
        Delete a journal entry from the database.
        """
        await self.db.delete(journal)
        await self.db.flush()
        logger.debug("Journal entry deleted from repository", journal_id=journal.id)

    async def update_journal(self, journal: Journal) -> Journal:
        """
        Update an existing journal entry.
        """
        await self.db.flush()
        await self.db.refresh(journal)
        return journal
