"""
Emora Backend - Chat Service

Responsibilities:
  - Orchestrate all Chat Module business logic.
  - Manage conversation lifecycle (create, list, delete).
  - Retrieve and paginate message history.
  - Stream AI responses from Groq LLM.
  - Generate conversation summaries via Groq.
  - Search messages across user conversations.

This service sits between the API layer and the repository layer, following
the Service Layer Pattern. It has no direct SQL queries — those belong in
ConversationRepository.
"""

from typing import AsyncGenerator, List, Optional, Sequence

from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AppException, NotFoundException, AuthorizationException
from app.core.logging import get_logger
from app.models.conversation import Conversation, Message
from app.agents.workflow import build_workflow
from app.prompts.summary_prompt import format_messages_for_summary, get_summary_prompt
from app.repositories.conversation import ConversationRepository
from app.schemas.chat import (
    ConversationCreate,
    SearchResult,
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
            ForbiddenException: If the conversation belongs to another user.

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
            ForbiddenException: If the conversation belongs to another user.
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
          2. Persist the user's message.
          3. Run the LangGraph agent graph (guardrail → intent → sentiment →
             crisis → memory → RAG → router → specialist → validation → generator).
          4. Stream the final response token-by-token.
          5. Persist the full assistant response.
          6. Update the conversation's updated_at timestamp.

        Yields:
            Individual text tokens from the final response.
        """
        # 1 — Verify conversation ownership
        conversation = await self.get_conversation(conversation_id, user_id)

        # 2 — Persist user message
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

        # 3 — Run LangGraph agentic workflow
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

        # 4 — Simulate token streaming from the final response
        # Split by words to create a smooth streaming effect
        words = full_response.split(" ")
        for i, word in enumerate(words):
            token = word if i == 0 else f" {word}"
            yield token

        # 5 — Persist full assistant response
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
        logger.info(
            "Conversation summary saved",
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
