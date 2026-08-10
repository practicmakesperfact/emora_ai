import json
from typing import Sequence
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException, AuthorizationException
from app.core.logging import get_logger
from app.models.journal import Journal
from app.repositories.journal import JournalRepository
from app.schemas.journal import JournalCreate
from app.prompts.journal_prompt import JOURNAL_ANALYSIS_SYSTEM_PROMPT, get_journal_analysis_prompt

logger = get_logger(__name__)

class JournalService:
    """Service layer for all Journaling business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = JournalRepository(db)
        self._groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def create_journal(self, user_id: int, payload: JournalCreate) -> Journal:
        """
        Create a daily journal entry, run AI analysis (summary, emotions, keywords), and persist.
        """
        analysis = await self._analyze_entry(payload.content)

        journal = Journal(
            user_id=user_id,
            content=payload.content,
            ai_summary=analysis.get("summary"),
            emotions=analysis.get("emotions", []),
            keywords=analysis.get("keywords", []),
        )

        created_journal = await self._repo.create_journal(journal)
        logger.info(
            "Journal entry saved and analyzed",
            user_id=user_id,
            journal_id=created_journal.id,
            emotions_count=len(created_journal.emotions or []),
        )
        return created_journal

    async def get_journal_history(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> Sequence[Journal]:
        """
        Retrieve journal entries history for a user, sorted newest first.
        """
        return await self._repo.get_by_user(user_id=user_id, skip=skip, limit=limit)

    async def get_journal_by_id(self, journal_id: int, user_id: int) -> Journal:
        """
        Retrieve a single journal entry and verify user ownership.
        """
        journal = await self._repo.get_by_id(journal_id)
        if not journal:
            raise NotFoundException(f"Journal entry with ID {journal_id} not found.")

        if journal.user_id != user_id:
            raise AuthorizationException("You do not have permission to view this journal entry.")

        return journal

    async def delete_journal(self, journal_id: int, user_id: int) -> None:
        """
        Delete a journal entry after verifying ownership.
        """
        journal = await self.get_journal_by_id(journal_id, user_id)
        await self._repo.delete_journal(journal)
        logger.info("Journal entry deleted", journal_id=journal_id, user_id=user_id)

    async def _analyze_entry(self, content: str) -> dict:
        """
        Helper method to call Groq LLM and parse summary, emotions, and keywords in JSON format.
        """
        default_analysis = {
            "summary": "Journal entry logged successfully.",
            "emotions": [],
            "keywords": [],
        }

        if not settings.GROQ_API_KEY:
            logger.warning("Groq API Key is not set; skipping journal AI analysis.")
            return default_analysis

        try:
            response = await self._groq.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": JOURNAL_ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": get_journal_analysis_prompt(content)},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=256,
            )
            raw_result = response.choices[0].message.content or "{}"
            result = json.loads(raw_result)
            return result
        except Exception as e:
            logger.error("Failed to run journal AI analysis via Groq", error=str(e))
            return default_analysis
