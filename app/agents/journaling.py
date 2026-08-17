"""
Journaling Agent
Assists with reflective journaling, prompting deeper self-reflection.
"""

from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.system_prompt import get_system_prompt
from app.prompts.journal_prompt import JOURNALING_SYSTEM_PROMPT

logger = get_logger(__name__)


async def journaling_node(state: dict, db) -> dict:
    """
    Generates a reflective journaling response.
    Sets: final_response
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    system = get_system_prompt() + "\n\n" + JOURNALING_SYSTEM_PROMPT
    if state.get("memory_context"):
        system += f"\n\n{state['memory_context']}"

    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": state["user_message"]},
            ],
            temperature=0.7,
            max_tokens=768,
        )
        final_response = response.choices[0].message.content or ""
    except Exception as e:
        logger.error("Journaling agent LLM call failed", error=str(e))
        final_response = "I'm here with you. Sometimes writing down how you feel can help — even just a few words about what's on your mind right now."

    return {**state, "final_response": final_response}
