"""
Emora Backend - Conversation Repository

Responsibilities:
  - All database CRUD operations for Conversation and Message models.
  - Keeps SQL/ORM logic out of the service layer.
  - Uses async SQLAlchemy 2.0 style queries.
"""

from typing import List, Optional, Sequence

from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.conversation import Conversation, Message

logger = get_logger(__name__)


class ConversationRepository:
    """Repository for Conversation and Message CRUD operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Conversations ────────────────────────────────────────────────────────

    async def create_conversation(
        self,
        user_id: int,
        title: str = "New Conversation",
    ) -> Conversation:
        """Create a new conversation for a user."""
        conversation = Conversation(user_id=user_id, title=title)
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        logger.debug("Conversation created", conversation_id=conversation.id, user_id=user_id)
        return conversation

    async def get_conversation_by_id(
        self, conversation_id: int
    ) -> Optional[Conversation]:
        """Fetch a conversation by primary key, eager-loading messages."""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        return result.scalar_one_or_none()

    async def get_conversations_by_user(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> Sequence[Conversation]:
        """Fetch all conversations for a user, newest first."""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_conversation(
        self,
        conversation: Conversation,
        title: Optional[str] = None,
        summary: Optional[str] = None,
    ) -> Conversation:
        """Update conversation title and/or summary."""
        if title is not None:
            conversation.title = title
        if summary is not None:
            conversation.summary = summary
        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)
        return conversation

    async def delete_conversation(self, conversation_id: int) -> None:
        """Hard-delete a conversation (cascades to messages via FK)."""
        await self.db.execute(
            delete(Conversation).where(Conversation.id == conversation_id)
        )
        await self.db.flush()
        logger.debug("Conversation deleted", conversation_id=conversation_id)

    # ─── Messages ─────────────────────────────────────────────────────────────

    async def create_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        sentiment: Optional[str] = None,
        intent: Optional[str] = None,
        source_citations: Optional[dict] = None,
        is_crisis_triggered: bool = False,
    ) -> Message:
        """Persist a single message to the database."""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            sentiment=sentiment,
            intent=intent,
            source_citations=source_citations,
            is_crisis_triggered=is_crisis_triggered,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        logger.debug(
            "Message created",
            message_id=message.id,
            conversation_id=conversation_id,
            role=role,
        )
        return message

    async def get_messages_by_conversation(
        self, conversation_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[Message]:
        """Fetch messages for a conversation in chronological order."""
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_messages(
        self, conversation_id: int, limit: int = 20
    ) -> List[Message]:
        """
        Fetch the N most recent messages for a conversation.
        Used to build the LLM context window.
        Returns messages in chronological order (oldest first).
        """
        # Fetch newest N, then reverse for chronological order
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return messages

    # ─── Search ───────────────────────────────────────────────────────────────

    async def search_messages(
        self,
        user_id: int,
        query: str,
        limit: int = 20,
    ) -> List[Message]:
        """
        Full-text search across all messages belonging to a user's conversations.
        Uses SQL LIKE for local simplicity. SQLite LIKE is case-insensitive by default;
        PostgreSQL ILIKE is used for case-insensitive matching.
        """
        # Subquery: conversations for this user
        user_conversations = (
            select(Conversation.id).where(Conversation.user_id == user_id).scalar_subquery()
        )

        result = await self.db.execute(
            select(Message)
            .where(
                Message.conversation_id.in_(user_conversations),
                Message.content.ilike(f"%{query}%"),
            )
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_message_by_id(self, message_id: int) -> Optional[Message]:
        """Fetch a single message by primary key."""
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        return result.scalar_one_or_none()

    async def delete_message(self, message: Message) -> None:
        """Hard-delete a single message from the database."""
        await self.db.delete(message)
        await self.db.flush()
        logger.debug("Message deleted", message_id=message.id)

    async def get_recent_messages_for_user(
        self, user_id: int, limit: int = 50
    ) -> List[Message]:
        """
        Fetch the most recent messages across ALL of a user's conversations.
        Useful for a global message feed.
        """
        user_conversations = (
            select(Conversation.id).where(Conversation.user_id == user_id).scalar_subquery()
        )
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id.in_(user_conversations))
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
