"""
Emora Backend - Chat Service

Responsibilities:
  - Orchestrate all Chat Module business logic.
  - Manage conversation lifecycle (create, list, delete).
  - Retrieve and paginate message history.
  - Stream AI responses from Groq LLM.
  - Generate conversation summaries via Groq.
  - Search messages across user conversations.
  - Enforce session-length limits (message count + duration).

This service sits between the API layer and the repository layer, following
the Service Layer Pattern. It has no direct SQL queries — those belong in
ConversationRepository.
"""

from typing import AsyncGenerator, List, Optional, Sequence
from datetime import datetime, timezone

from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    NotFoundException,
    AuthorizationException,
    SessionLimitException,
)
from app.core.logging import get_logger
from app.models.conversation import Conversation, Message
from app.agents.workflow import build_workflow
from app.prompts.summary_prompt import format_messages_for_summary, get_summary_prompt
from app.repositories.conversation import ConversationRepository
from app.schemas.chat import (
    ConversationCreate,
    SearchResult,
    SessionStatusOut,
)

logger = get_logger(__name__)


class ChatService:
    """
    Service layer for all Chat Module operations.

    Args:
        db: The async SQLAlchemy database session injected per request.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ConversationRepository(db)
        self._groq = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # ─── Conversation Management ───────────────────────────────────────────────

    async def start_conversation(
        self, user_id: int, payload: ConversationCreate
    ) -> Conversation:
        """
        Create a new conversation for a user.

        Args:
            user_id: ID of the authenticated user.
            payload: The creation payload containing an optional title.

        Returns:
            The newly created Conversation ORM instance.
        """
        title = payload.title or "New Conversation"
        conversation = await self._repo.create_conversation(
            user_id=user_id, title=title
        )
        logger.info("Conversation started", user_id=user_id, conversation_id=conversation.id)
        return conversation

    async def list_conversations(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[Conversation]:
        """
        Return all conversations for the given user, newest first.

        Args:
            user_id: ID of the authenticated user.
            skip: Offset for pagination.
            limit: Maximum number of conversations to return.

        Returns:
            List of Conversation ORM instances.
        """
        return await self._repo.get_conversations_by_user(
            user_id=user_id, skip=skip, limit=limit
        )

    async def get_conversation(
        self, conversation_id: int, user_id: int
    ) -> Conversation:
        """
        Fetch a single conversation, enforcing ownership.

        Args:
            conversation_id: Primary key of the conversation.
            user_id: ID of the currently authenticated user.

        Raises:
            NotFoundException: If the conversation does not exist.
            AuthorizationException: If the conversation belongs to another user.

        Returns:
            The Conversation ORM instance.
        """
        conversation = await self._repo.get_conversation_by_id(conversation_id)
        if not conversation:
            raise NotFoundException(f"Conversation {conversation_id} not found.")
        if conversation.user_id != user_id:
            raise AuthorizationException("You do not have access to this conversation.")
        return conversation

    async def delete_conversation(
        self, conversation_id: int, user_id: int
    ) -> None:
        """
        Delete a conversation and all its messages.

        Args:
            conversation_id: Primary key of the conversation.
            user_id: ID of the currently authenticated user.

        Raises:
            NotFoundException: If the conversation does not exist.
            AuthorizationException: If the conversation belongs to another user.
        """
        conversation = await self.get_conversation(conversation_id, user_id)
        await self._repo.delete_conversation(conversation.id)
        logger.info(
            "Conversation deleted",
            conversation_id=conversation_id,
            user_id=user_id,
        )

    # ─── Message History ───────────────────────────────────────────────────────

    async def get_messages(
        self,
        conversation_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Message]:
        """
        Retrieve paginated message history for a conversation.

        Verifies that the conversation belongs to the requesting user.

        Args:
            conversation_id: Primary key of the conversation.
            user_id: ID of the currently authenticated user.
            skip: Offset for pagination.
            limit: Maximum number of messages to return.

        Returns:
            List of Message ORM instances in chronological order.
        """
        await self.get_conversation(conversation_id, user_id)  # Enforces ownership
        return await self._repo.get_messages_by_conversation(
            conversation_id=conversation_id, skip=skip, limit=limit
        )

    # ─── AI Response Streaming (Agentic Workflow) ──────────────────────────────

    async def stream_response(
        self,
        conversation_id: int,
        user_id: int,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Agentic AI response pipeline via LangGraph workflow:
          1. Verify conversation ownership.
          2. Enforce session limits (message count + duration).
          3. Persist the user's message.
          4. Run the LangGraph agent graph (guardrail → intent → sentiment →
             crisis → memory → RAG → router → specialist → validation → generator).
          5. Stream the final response token-by-token.
          6. Persist the full assistant response.
          7. Update the conversation's updated_at timestamp.

        Yields:
            Individual text tokens from the final response.
        """
        # 1 — Verify conversation ownership
        conversation = await self.get_conversation(conversation_id, user_id)

        # 2 — Enforce session limits (message count + duration)
        await self._enforce_session_limits(conversation)

        # 3 — Persist user message
        await self._repo.create_message(
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )

        logger.info(
            "Running agentic workflow",
            conversation_id=conversation_id,
            user_id=user_id,
        )

        # 4 — Run LangGraph agentic workflow
        full_response = ""
        try:
            initial_state = {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "user_message": user_message,
                "is_safe": True,
                "violation_type": "none",
                "intent": "general_question",
                "sentiment": "Neutral",
                "sentiment_confidence": 0.5,
                "risk_level": "None",
                "is_crisis": False,
                "crisis_response": None,
                "memory_context": "",
                "rag_context": "",
                "final_response": "",
                "response_tokens": [],
                # Language — language_node will update these each turn
                "target_language": "en",
                "language_locked": False,
            }

            workflow = build_workflow(self._db)
            final_state = await workflow.ainvoke(initial_state)
            full_response = final_state.get("final_response", "")

        except Exception as exc:
            logger.error(
                "Agentic workflow failed",
                conversation_id=conversation_id,
                error=str(exc),
            )
            full_response = (
                "I'm sorry, I'm having trouble connecting right now. "
                "Please try again in a moment."
            )

        # 5 — Persist full assistant response immediately
        await self._repo.create_message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
        )

        # 6 — Touch the conversation's updated_at
        await self._repo.update_conversation(conversation)
        logger.info(
            "Agentic response persisted",
            conversation_id=conversation_id,
            response_length=len(full_response),
        )

        # 7 — Simulate token streaming from the final response
        # Split by words to create a smooth streaming effect
        words = full_response.split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else f" {word}"
            yield token

    # ─── Session Limit Enforcement ─────────────────────────────────────────────

    async def _enforce_session_limits(self, conversation: Conversation) -> None:
        """
        Raise SessionLimitException if the conversation has exceeded either:
          - SESSION_MAX_MESSAGES  user messages, OR
          - SESSION_MAX_DURATION_MINUTES minutes since conversation was created.

        This prevents unhealthy emotional over-dependence on the AI (req.md §Deceptive Empathy).
        """
        max_msgs = settings.SESSION_MAX_MESSAGES
        max_minutes = settings.SESSION_MAX_DURATION_MINUTES

        # Check message count
        user_msg_count = await self._repo.count_user_messages_in_conversation(
            conversation.id
        )
        if user_msg_count >= max_msgs:
            logger.warning(
                "Session message limit reached",
                conversation_id=conversation.id,
                user_msg_count=user_msg_count,
                limit=max_msgs,
            )
            raise SessionLimitException(
                message=(
                    f"This conversation has reached the {max_msgs}-message limit. "
                    "Please start a new conversation to continue. "
                    "Taking a break helps maintain a healthy balance."
                ),
                limit_type="message_count",
                details={"count": user_msg_count, "limit": max_msgs},
            )

        # Check session duration
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        session_age_minutes = (now_utc - conversation.created_at).total_seconds() / 60
        if session_age_minutes >= max_minutes:
            logger.warning(
                "Session duration limit reached",
                conversation_id=conversation.id,
                age_minutes=round(session_age_minutes),
                limit=max_minutes,
            )
            raise SessionLimitException(
                message=(
                    f"This conversation has been active for over {max_minutes} minutes. "
                    "Please start a new conversation. "
                    "Regular breaks are part of healthy support use."
                ),
                limit_type="duration",
                details={
                    "age_minutes": round(session_age_minutes),
                    "limit_minutes": max_minutes,
                },
            )

    # ─── Session Status ─────────────────────────────────────────────────────────

    async def get_session_status(
        self, conversation_id: int, user_id: int
    ) -> SessionStatusOut:
        """
        Return current session usage vs configured limits.
        Called by GET /chat/{id}/session-status so the frontend can
        show a warning banner before the limit is hit.
        """
        conversation = await self.get_conversation(conversation_id, user_id)
        max_msgs = settings.SESSION_MAX_MESSAGES
        max_minutes = settings.SESSION_MAX_DURATION_MINUTES

        user_msg_count = await self._repo.count_user_messages_in_conversation(conversation_id)
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        age_minutes = int((now_utc - conversation.created_at).total_seconds() / 60)

        msgs_remaining = max(0, max_msgs - user_msg_count)
        mins_remaining = max(0, max_minutes - age_minutes)

        return SessionStatusOut(
            conversation_id=conversation_id,
            user_message_count=user_msg_count,
            max_messages=max_msgs,
            session_age_minutes=age_minutes,
            max_duration_minutes=max_minutes,
            messages_remaining=msgs_remaining,
            minutes_remaining=mins_remaining,
            is_message_limit_reached=user_msg_count >= max_msgs,
            is_duration_limit_reached=age_minutes >= max_minutes,
            is_limit_reached=user_msg_count >= max_msgs or age_minutes >= max_minutes,
        )

    async def get_daily_usage(self, user_id: int) -> "DailyUsageOut":
        """
        Return how many messages the user has sent today (UTC) across all
        conversations. Used by the frontend chat-list page as a soft
        transparency indicator — it is NOT enforced server-side.
        """
        from app.schemas.chat import DailyUsageOut

        daily_limit = settings.SESSION_DAILY_SOFT_LIMIT
        messages_today = await self._repo.count_user_messages_today(user_id)
        pct = min(100.0, round((messages_today / daily_limit) * 100, 1))

        return DailyUsageOut(
            messages_today=messages_today,
            daily_soft_limit=daily_limit,
            usage_percent=pct,
            is_approaching_limit=pct >= 80.0,
        )

    # ─── Conversation Summary ──────────────────────────────────────────────────

    async def summarize_conversation(
        self, conversation_id: int, user_id: int
    ) -> str:
        """
        Generate and persist a natural-language summary of the conversation.

        Sends all messages to the Groq LLM with a summarization prompt,
        stores the result in conversation.summary, and returns it.

        Args:
            conversation_id: Primary key of the conversation.
            user_id: ID of the currently authenticated user.

        Returns:
            The generated summary string.
        """
        conversation = await self.get_conversation(conversation_id, user_id)
        messages = await self._repo.get_messages_by_conversation(conversation_id)

        if not messages:
            raise AppException(
                status_code=400,
                message="Cannot summarize an empty conversation.",
            )

        # Build the summary prompt
        history_text = format_messages_for_summary(list(messages))
        prompt = get_summary_prompt(history_text)

        # Call Groq (non-streaming for summary)
        logger.info("Generating conversation summary", conversation_id=conversation_id)
        try:
            response = await self._groq.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a clinical summary assistant."},
                    {"role": "user", "content": prompt},
                ],
                stream=False,
                temperature=0.3,
                max_tokens=256,
            )
            summary = response.choices[0].message.content or ""
        except Exception as exc:
            logger.error(
                "Groq summarization failed",
                conversation_id=conversation_id,
                error=str(exc),
            )
            raise AppException(
                status_code=503,
                message="AI summarization service is temporarily unavailable.",
            )

        # Persist the summary
        await self._repo.update_conversation(conversation, summary=summary)

        # Also store the summary in the memories table for long-term agent access
        from app.models.memory import Memory
        memory_record = Memory(
            conversation_id=conversation_id,
            memory_type="summary",
            content=summary,
        )
        self._db.add(memory_record)
        await self._db.flush()

        logger.info(
            "Conversation summary saved to conversation and memories tables",
            conversation_id=conversation_id,
            summary_length=len(summary),
        )
        return summary

    # ─── Search ────────────────────────────────────────────────────────────────

    async def search_conversations(
        self, user_id: int, query: str, limit: int = 20
    ) -> List[SearchResult]:
        """
        Full-text search across all of the user's messages.

        Args:
            user_id: ID of the currently authenticated user.
            query: The search string.
            limit: Maximum number of results to return.

        Returns:
            List of SearchResult schema instances with message context.
        """
        if not query or len(query.strip()) < 2:
            raise AppException(
                status_code=400,
                message="Search query must be at least 2 characters.",
            )

        messages = await self._repo.search_messages(
            user_id=user_id, query=query.strip(), limit=limit
        )

        results: List[SearchResult] = []
        for msg in messages:
            # Lazy load the conversation title for each result
            conv = await self._repo.get_conversation_by_id(msg.conversation_id)
            if conv:
                results.append(
                    SearchResult(
                        message_id=msg.id,
                        conversation_id=msg.conversation_id,
                        conversation_title=conv.title,
                        role=msg.role,
                        content=msg.content,
                        created_at=msg.created_at,
                    )
                )

        logger.info(
            "Search completed",
            user_id=user_id,
            query=query,
            results_count=len(results),
        )
        return results
