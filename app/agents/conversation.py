"""
Conversation Agent
Generates standard empathetic dialogue for general mental health support.
Uses memory context, RAG knowledge, and the system prompt.
"""

from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger
from app.prompts.system_prompt import get_system_prompt

logger = get_logger(__name__)


async def conversation_node(state: dict, db) -> dict:
    """
    Default conversational agent for empathetic mental health support.
    Sets: final_response
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    system = get_system_prompt()
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
            temperature=0.7,
            max_tokens=1024,
        )
        final_response = response.choices[0].message.content or ""
    except Exception as e:
        logger.error("Conversation agent LLM call failed", error=str(e))
        final_response = (
            "I'm sorry, I'm having trouble connecting right now. "
            "Please try again in a moment."
        )

    logger.debug("Conversation agent generated response", user_id=state["user_id"])
    return {**state, "final_response": final_response}
