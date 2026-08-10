"""
Emora Backend - Crisis Service
Orchestrates crisis detection, incident logging, and counselor management.
"""

import json
from typing import Sequence
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.core.logging import get_logger
from app.models.crisis import Incident
from app.repositories.crisis import CrisisRepository
from app.prompts.crisis_prompt import (
    CRISIS_DETECTION_SYSTEM_PROMPT,
    CRISIS_RESPONSE_HIGH,
    get_crisis_detection_prompt,
)

logger = get_logger(__name__)

HIGH_RISK_LEVELS = {"High", "Critical"}


class CrisisService:
    """Service layer for crisis detection and incident management."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = CrisisRepository(db)
        self._groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def assess_message(
        self, user_id: int, message: str, conversation_id: int | None = None
    ) -> dict:
        """
        Classify the risk level of a user message. If High or Critical,
        log an incident and return the crisis response text.

        Returns:
            dict with keys: risk_level, is_crisis, response_override (if crisis)
        """
        assessment = await self._classify_risk(message)
        risk_level = assessment.get("risk_level", "None")
        reason = assessment.get("reason", "")

        result: dict = {"risk_level": risk_level, "is_crisis": False}

        if risk_level in HIGH_RISK_LEVELS:
            result["is_crisis"] = True
            result["response_override"] = CRISIS_RESPONSE_HIGH

            incident = Incident(
                user_id=user_id,
                conversation_id=conversation_id,
                message_content=message,
                risk_level=risk_level,
                action_taken=f"Crisis response displayed. Reason: {reason}",
                resolved=False,
            )
            await self._repo.create_incident(incident)
            logger.warning(
                "Crisis incident logged",
                user_id=user_id,
                risk_level=risk_level,
                incident_id=incident.id,
            )

        return result

    async def list_incidents(self, skip: int = 0, limit: int = 100) -> Sequence[Incident]:
        """List all crisis incidents for counselor review."""
        return await self._repo.get_all(skip=skip, limit=limit)

    async def get_incident(self, incident_id: int) -> Incident:
        """Retrieve a single incident by ID."""
        incident = await self._repo.get_by_id(incident_id)
        if not incident:
            raise NotFoundException(f"Incident {incident_id} not found.")
        return incident

    async def resolve_incident(
        self, incident_id: int, counselor_notes: str | None = None
    ) -> Incident:
        """Mark an incident as resolved with optional counselor notes."""
        incident = await self.get_incident(incident_id)
        incident.resolved = True
        if counselor_notes:
            incident.counselor_notes = counselor_notes
        updated = await self._repo.update_incident(incident)
        logger.info("Crisis incident resolved", incident_id=incident_id)
        return updated

    async def _classify_risk(self, message: str) -> dict:
        """Call Groq to classify crisis risk level. Returns dict with risk_level and reason."""
        default = {"risk_level": "None", "reason": "Assessment unavailable."}
        try:
            response = await self._groq.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": CRISIS_DETECTION_SYSTEM_PROMPT},
                    {"role": "user", "content": get_crisis_detection_prompt(message)},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=128,
            )
            raw = response.choices[0].message.content or "{}"
            return json.loads(raw)
        except Exception as e:
            logger.error("Crisis classification failed", error=str(e))
            return default
