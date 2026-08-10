"""
Emora Backend - Document Repository
Database operations for KnowledgeDocument records.
"""

from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger
from app.models.document import KnowledgeDocument

logger = get_logger(__name__)


class DocumentRepository:
    """Repository for managing KnowledgeDocument database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_document(self, document: KnowledgeDocument) -> KnowledgeDocument:
        """Persist a new KnowledgeDocument record."""
        self.db.add(document)
        await self.db.flush()
        await self.db.refresh(document)
        logger.debug("Knowledge document created", doc_id=document.id, title=document.title)
        return document

    async def get_by_id(self, document_id: int) -> Optional[KnowledgeDocument]:
        """Retrieve a single document by primary key."""
        result = await self.db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> Sequence[KnowledgeDocument]:
        """Retrieve all knowledge documents."""
        result = await self.db.execute(
            select(KnowledgeDocument)
            .order_by(KnowledgeDocument.upload_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_document(self, document: KnowledgeDocument) -> None:
        """Delete a document from the database."""
        await self.db.delete(document)
        await self.db.flush()
        logger.debug("Knowledge document deleted", doc_id=document.id)
