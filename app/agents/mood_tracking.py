"""
Mood Tracking Agent
Detects mood logging intent and guides the user to log their mood via the app.
"""

from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.system_prompt import get_system_prompt

logger = get_logger(__name__)

MOOD_TRACKING_PROMPT = """You are a mood tracking assistant embedded in a mental health app.
When a user mentions their mood or feelings, help them:
1. Acknowledge what they're feeling with empathy.
2. Gently encourage them to log their mood formally (score 1-10) in the app for trend tracking.
3. Ask ONE follow-up question about what might be contributing to how they feel.

Keep your response concise, warm, and non-clinical.
"""


async def mood_tracking_node(state: dict, db) -> dict:
    """
    Guides the user to log their mood and provides an empathetic acknowledgment.
    Sets: final_response
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    system = get_system_prompt() + "\n\n" + MOOD_TRACKING_PROMPT
    if state.get("memory_context"):
        system += f"\n\n{state['memory_context']}"

    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": state["user_message"]},
            ],
            temperature=0.65,
            max_tokens=512,
        )
        final_response = response.choices[0].message.content or ""
    except Exception as e:
        logger.error("Mood tracking agent LLM call failed", error=str(e))
        final_response = "Thank you for sharing how you feel. You can log your mood score (1-10) using the Mood tracker in the app."

    return {**state, "final_response": final_response}
