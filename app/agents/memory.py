"""
Memory Agent
Fetches short-term (recent messages) and long-term memory from the database.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.logging import get_logger
from app.models.memory import Memory
from app.repositories.conversation import ConversationRepository

logger = get_logger(__name__)

SHORT_TERM_LIMIT = 20
LONG_TERM_LIMIT = 5


async def memory_node(state: dict, db: AsyncSession) -> dict:
    """
    Loads conversation context from DB:
    - Short-term: last N messages from the current conversation
    - Long-term: stored memory summaries for the conversation
    Sets: memory_context
    """
    repo = ConversationRepository(db)

    # Short-term: recent messages
    recent_messages = await repo.get_recent_messages(
        conversation_id=state["conversation_id"],
        limit=SHORT_TERM_LIMIT,
    )
    short_term = "\n".join(
        f"{msg.role.upper()}: {msg.content}" for msg in recent_messages
    )

    # Long-term: memory summaries stored in memories table
    long_term = ""
    try:
        result = await db.execute(
            select(Memory)
            .where(Memory.conversation_id == state["conversation_id"])
            .order_by(Memory.created_at.desc())
            .limit(LONG_TERM_LIMIT)
        )
        memories = result.scalars().all()
        if memories:
            long_term = "\n".join(f"[MEMORY] {m.content}" for m in memories)
    except Exception as e:
        logger.error("Failed to fetch long-term memory", error=str(e))

    memory_context = ""
    if long_term:
        memory_context += f"Long-term memory:\n{long_term}\n\n"
    if short_term:
        memory_context += f"Recent conversation:\n{short_term}"

    logger.debug(
        "Memory context loaded",
        conversation_id=state["conversation_id"],
        short_term_msgs=len(recent_messages),
    )
    return {**state, "memory_context": memory_context}
