"""
Guardrail Agent
Detects prompt injection, jailbreaks, unsafe content, and PII before processing.
"""

import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.guardrail_prompt import GUARDRAIL_SYSTEM_PROMPT, get_guardrail_prompt

logger = get_logger(__name__)


async def guardrail_node(state: dict, db) -> dict:
    """
    Classifies the user message for safety violations.
    Sets: is_safe, violation_type
    """
    message = state["user_message"]
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": GUARDRAIL_SYSTEM_PROMPT},
                {"role": "user", "content": get_guardrail_prompt(message)},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=128,
        )
        raw = response.choices[0].message.content or "{}"
        result = json.loads(raw)
    except Exception as e:
        logger.error("Guardrail agent failed", error=str(e))
        result = {"is_safe": True, "violation_type": "none", "reason": "check skipped"}

    is_safe = result.get("is_safe", True)
    violation_type = result.get("violation_type", "none")

    if not is_safe:
        logger.warning("Guardrail blocked input", violation_type=violation_type)
        return {
            **state,
            "is_safe": False,
            "violation_type": violation_type,
            "final_response": (
                "I'm sorry, I'm not able to process that kind of request. "
                "Please keep our conversation focused on mental health support."
            ),
        }

    return {**state, "is_safe": True, "violation_type": "none"}
