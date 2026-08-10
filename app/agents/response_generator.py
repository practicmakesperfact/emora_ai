"""
Response Generator Agent
Final node — prepares the output state for streaming. No LLM call needed.
"""

from app.core.logging import get_logger

logger = get_logger(__name__)


async def response_generator_node(state: dict) -> dict:
    """
    Finalizes the response. The final_response is already set by the
    specialist or validation agent. This node signals completion.
    """
    logger.debug(
        "Response generator node executed",
        user_id=state.get("user_id"),
        response_length=len(state.get("final_response", "")),
    )
    return state
