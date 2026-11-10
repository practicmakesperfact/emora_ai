from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.user import UserRepository
from app.schemas.user import UserUpdate
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.models.mood import MoodLog
from app.models.journal import Journal
from app.core.exceptions import NotFoundException, ValidationException
from app.security.password import hash_password

class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def get_user_by_id(self, user_id: int) -> User:
        """Fetch user by ID. Raises NotFoundException if user is missing."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def get_user_by_email(self, email: str) -> User:
        """Fetch user by email. Raises NotFoundException if user is missing."""
        user = await self.repository.get_by_email(email)
        if not user:
            raise NotFoundException("User with this email not found")
        return user

    async def update_user(self, user_id: int, user_update: UserUpdate) -> User:
        """
        Update user attributes. Handles password hashing and email conflicts.
        """
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        # Extract data to update
        update_data = user_update.model_dump(exclude_unset=True)

        # Check if email is being updated and is already taken
        if "email" in update_data and update_data["email"] != user.email:
            existing_user = await self.repository.get_by_email(update_data["email"])
            if existing_user:
                raise ValidationException("Email already in use")

        # Hash new password if supplied
        if "password" in update_data:
            update_data["hashed_password"] = hash_password(update_data.pop("password"))

        # Apply fields
        for field, value in update_data.items():
            setattr(user, field, value)

        return await self.repository.update(user)

    async def delete_user(self, user_id: int) -> None:
        """Delete user by ID."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        await self.repository.delete(user)

    async def export_user_data(self, user_id: int) -> Dict[str, Any]:
        """
        Collect all personal data for a user and return as a serialisable dict.
        Includes: profile, conversations (with messages), mood logs, journal entries.
        """
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        # ── Conversations + Messages ──────────────────────────────────────────
        conv_result = await self.repository.db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.created_at)
        )
        conversations = conv_result.scalars().all()

        conv_export = []
        for conv in conversations:
            conv_export.append({
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at.isoformat(),
                "messages": [
                    {
                        "id": msg.id,
                        "role": msg.role,
                        "content": msg.content,
                        "created_at": msg.created_at.isoformat(),
                    }
                    for msg in conv.messages
                ],
            })

        # ── Mood Logs ─────────────────────────────────────────────────────────
        mood_result = await self.repository.db.execute(
            select(MoodLog)
            .where(MoodLog.user_id == user_id)
            .order_by(MoodLog.created_at)
        )
        mood_logs = mood_result.scalars().all()
        mood_export = [
            {
                "id": log.id,
                "score": log.score,
                "emotions": log.emotions,
                "mood_notes": log.mood_notes,
                "created_at": log.created_at.isoformat(),
            }
            for log in mood_logs
        ]

        # ── Journal Entries ───────────────────────────────────────────────────
        journal_result = await self.repository.db.execute(
            select(Journal)
            .where(Journal.user_id == user_id)
            .order_by(Journal.created_at)
        )
        journals = journal_result.scalars().all()
        journal_export = [
            {
                "id": j.id,
                "content": j.content,
                "ai_summary": j.ai_summary,
                "emotions": j.emotions,
                "keywords": j.keywords,
                "created_at": j.created_at.isoformat(),
            }
            for j in journals
        ]

        return {
            "exported_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "profile": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "preferred_language": user.preferred_language,
                "time_zone": user.time_zone,
                "mental_wellness_goal": user.mental_wellness_goal,
                "created_at": user.created_at.isoformat(),
            },
            "conversations": conv_export,
            "mood_logs": mood_export,
            "journal_entries": journal_export,
        }
