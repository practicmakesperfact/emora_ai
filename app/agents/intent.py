"""
Intent Classification Agent
Recognizes the user's intent to route to the correct specialist agent.
"""

import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.intent_prompt import INTENT_SYSTEM_PROMPT

logger = get_logger(__name__)


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
