"""
Crisis Detection Agent
Evaluates distress risk and logs incidents for High/Critical levels.
"""

from app.core.logging import get_logger
from app.services.crisis_service import CrisisService

logger = get_logger(__name__)


async def crisis_node(state: dict, db) -> dict:
    """
    Assesses crisis risk level. If High or Critical, logs an incident
    and sets a crisis response override.
    Sets: risk_level, is_crisis, crisis_response
    """
    crisis_service = CrisisService(db)
    assessment = await crisis_service.assess_message(
        user_id=state["user_id"],
        message=state["user_message"],
        conversation_id=state["conversation_id"],
    )

    risk_level = assessment.get("risk_level", "None")
    is_crisis = assessment.get("is_crisis", False)
    crisis_response = assessment.get("response_override")

    if is_crisis:
        logger.warning(
            "Crisis detected in message",
            user_id=state["user_id"],
            risk_level=risk_level,
        )
        return {
            **state,
            "risk_level": risk_level,
            "is_crisis": True,
            "crisis_response": crisis_response,
            "final_response": crisis_response or "",
        }

    return {**state, "risk_level": risk_level, "is_crisis": False, "crisis_response": None}
