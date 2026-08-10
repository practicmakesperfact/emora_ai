"""
CBT Agent
Provides structured Cognitive Behavioral Therapy exercises and reframing.
"""

from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.cbt_prompt import get_cbt_prompt
from app.prompts.system_prompt import get_system_prompt

logger = get_logger(__name__)


async def cbt_node(state: dict, db) -> dict:
    """
    Generates a CBT-structured response using memory and RAG context.
    Sets: final_response
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    system = get_system_prompt() + "\n\n" + get_cbt_prompt()
    if state.get("memory_context"):
        system += f"\n\n{state['memory_context']}"
    if state.get("rag_context"):
        system += f"\n\n{state['rag_context']}"

    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": state["user_message"]},
            ],
            temperature=0.6,
            max_tokens=1024,
        )
        final_response = response.choices[0].message.content or ""
    except Exception as e:
        logger.error("CBT agent LLM call failed", error=str(e))
        final_response = (
            "I'm having a moment of difficulty connecting. "
            "Let's try a simple grounding exercise: take a slow, deep breath with me."
        )

    logger.debug("CBT agent generated response", user_id=state["user_id"])
    return {**state, "final_response": final_response}
