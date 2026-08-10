"""
Response Validation Agent
Ensures the AI response doesn't contain medical advice, hallucinations,
or unsafe content before sending to the user.
"""

import json
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

VALIDATION_SYSTEM_PROMPT = """You are a response safety validator for a mental health chatbot.
Review the AI assistant's response and check if it:
1. Prescribes or recommends specific medications or dosages.
2. Makes clinical diagnoses.
3. Contains factually incorrect mental health information.
4. Makes unrealistic promises about outcomes.

If any violation is found, rewrite the response to remove the problematic content while keeping the supportive tone.
If the response is safe, return it unchanged.

Respond ONLY with valid JSON:
{"is_valid": true/false, "response": "<final safe response>"}
"""


async def response_validation_node(state: dict, db) -> dict:
    """
    Validates and optionally rewrites the response to remove unsafe content.
    Sets: final_response (corrected if needed)
    """
    response_to_validate = state.get("final_response", "")

    if not response_to_validate:
        return state

    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    try:
        result = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": VALIDATION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Validate this response:\n\n{response_to_validate}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1024,
        )
        raw = result.choices[0].message.content or "{}"
        validated = json.loads(raw)
        final = validated.get("response", response_to_validate)
        is_valid = validated.get("is_valid", True)

        if not is_valid:
            logger.warning("Response validation rewrote unsafe content")

        return {**state, "final_response": final}
    except Exception as e:
        logger.error("Response validation failed, using original", error=str(e))
        return state
