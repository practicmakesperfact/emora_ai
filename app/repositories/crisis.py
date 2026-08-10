"""
Emora Backend - Crisis Repository
Database operations for Incident (crisis event) records.
"""

from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger
from app.models.crisis import Incident

logger = get_logger(__name__)


class CrisisRepository:
    """Repository for managing Incident database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_incident(self, incident: Incident) -> Incident:
        """Persist a new crisis incident."""
        self.db.add(incident)
        await self.db.flush()
        await self.db.refresh(incident)
        logger.debug(
            "Crisis incident created",
            incident_id=incident.id,
            user_id=incident.user_id,
            risk_level=incident.risk_level,
        )
        return incident

    async def get_by_id(self, incident_id: int) -> Optional[Incident]:
        """Retrieve a single Incident by primary key."""
        result = await self.db.execute(
            select(Incident).where(Incident.id == incident_id)
        )
        return result.scalar_one_or_none()

    async def get_all_unresolved(self, skip: int = 0, limit: int = 100) -> Sequence[Incident]:
        """Retrieve all unresolved incidents for counselor review."""
        result = await self.db.execute(
            select(Incident)
            .where(Incident.resolved == False)  # noqa: E712
            .order_by(Incident.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[Incident]:
        """Retrieve all incidents for counselor/admin review."""
        result = await self.db.execute(
            select(Incident)
            .order_by(Incident.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_incident(self, incident: Incident) -> Incident:
        """Flush and refresh an updated incident."""
        await self.db.flush()
        await self.db.refresh(incident)
        return incident
