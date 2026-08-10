"""
Router Agent
Determines which specialist agent should handle the response based on intent.
"""

from app.core.logging import get_logger

logger = get_logger(__name__)


async def router_node(state: dict) -> dict:
    """
    Passes state through — routing decisions are made via LangGraph
    conditional edges based on state['intent']. No LLM call needed.
    """
    logger.debug("Router node executed", intent=state.get("intent", "general_question"))
    return state
