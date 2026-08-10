"""
Intent Classification Agent
Recognizes the user's intent to route to the correct specialist agent.
"""

import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

INTENT_SYSTEM_PROMPT = """Classify the user's intent from their message.
Choose ONE label from: greeting, general_question, mood_logging, journal_entry,
cbt_request, advice_request, crisis_situation, stress, anxiety, academic_pressure, relationship_issues.

Respond ONLY with a valid JSON object:
{"intent": "<label>", "confidence": <0.0-1.0>}
"""


async def intent_node(state: dict, db) -> dict:
    """
    Classifies user intent.
    Sets: intent
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                {"role": "user", "content": state["user_message"]},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=64,
        )
        raw = response.choices[0].message.content or "{}"
        result = json.loads(raw)
    except Exception as e:
        logger.error("Intent agent failed", error=str(e))
        result = {"intent": "general_question", "confidence": 0.5}

    intent = result.get("intent", "general_question")
    logger.debug("Intent classified", intent=intent, user_id=state["user_id"])
    return {**state, "intent": intent}
