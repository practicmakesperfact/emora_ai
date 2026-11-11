"""
Emora Backend - Chat API Router

Routes:
  POST   /api/v1/chat                               - Start a new conversation
  GET    /api/v1/chat                               - List user's conversations
  DELETE /api/v1/chat/{conversation_id}             - Delete a conversation
  GET    /api/v1/chat/{conversation_id}/messages    - Get conversation message history
  POST   /api/v1/chat/{conversation_id}/messages    - Send a message (streams AI response)
  POST   /api/v1/chat/{conversation_id}/summary     - Generate conversation summary
  GET    /api/v1/chat/search                        - Search across all conversations

All routes require authentication (Bearer token).
Streaming responses use Server-Sent Events (SSE) via StreamingResponse.
"""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_user
from app.core.config import settings
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationOut,
    ConversationRename,
    ConversationSearchResponse,
    ConversationSummaryResponse,
    DailyUsageOut,
    MessageCreate,
    MessageOut,
    SearchResult,
    SessionStatusOut,
)
from app.services.chat_service import ChatService

logger = get_logger(__name__)

# Require User role for all chat endpoints
router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
    dependencies=[Depends(require_user)],
)


# ─── Start Conversation ────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new conversation",
    description="Creates a new conversation session for the authenticated user.",
)
async def start_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationOut:
    """Create a new conversation."""
    service = ChatService(db)
    conversation = await service.start_conversation(
        user_id=current_user.id, payload=payload
    )
    logger.info("Conversation created via API", user_id=current_user.id, conversation_id=conversation.id)
    return conversation


# ─── List Conversations ────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[ConversationOut],
    status_code=status.HTTP_200_OK,
    summary="List all conversations",
    description="Returns all conversations for the authenticated user, sorted by most recent activity.",
)
async def list_conversations(
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum conversations to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[ConversationOut]:
    """Retrieve all conversations for the authenticated user."""
    service = ChatService(db)
    conversations = await service.list_conversations(
        user_id=current_user.id, skip=skip, limit=limit
    )
    return list(conversations)


# ─── Search Conversations ──────────────────────────────────────────────────────

@router.get(
    "/search",
    response_model=ConversationSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search conversations and messages",
    description="Full-text search across all messages in the user's conversations.",
)
async def search_conversations(
    q: str = Query(..., min_length=2, description="Search query string"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum results to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationSearchResponse:
    """Search messages across all conversations for the authenticated user."""
    service = ChatService(db)
    results = await service.search_conversations(
        user_id=current_user.id, query=q, limit=limit
    )
    return ConversationSearchResponse(query=q, results=results)


# ─── Delete Conversation ───────────────────────────────────────────────────────

@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    description="Permanently deletes a conversation and all its messages. User must own the conversation.",
)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a conversation belonging to the authenticated user."""
    service = ChatService(db)
    await service.delete_conversation(
        conversation_id=conversation_id, user_id=current_user.id
    )


# ─── Rename Conversation ───────────────────────────────────────────────────────

@router.patch(
    "/{conversation_id}/rename",
    response_model=ConversationOut,
    status_code=status.HTTP_200_OK,
    summary="Rename a conversation",
    description="Updates the title of a conversation owned by the authenticated user.",
)
async def rename_conversation(
    conversation_id: int,
    payload: ConversationRename,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationOut:
    """Rename a conversation title."""
    service = ChatService(db)
    conversation = await service.rename_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        new_title=payload.title,
    )
    logger.info(
        "Conversation renamed via API",
        user_id=current_user.id,
        conversation_id=conversation_id,
    )
    return conversation


# ─── Get Message History ───────────────────────────────────────────────────────

@router.get(
    "/{conversation_id}/messages",
    response_model=List[MessageOut],
    status_code=status.HTTP_200_OK,
    summary="Get conversation message history",
    description="Returns the paginated message history for a specific conversation.",
)
async def get_messages(
    conversation_id: int,
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=100, ge=1, le=500, description="Maximum messages to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[MessageOut]:
    """Retrieve all messages in a conversation."""
    service = ChatService(db)
    messages = await service.get_messages(
        conversation_id=conversation_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return list(messages)


# ─── Send Message (Streaming) ──────────────────────────────────────────────────

@router.post(
    "/{conversation_id}/messages",
    response_class=StreamingResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a message and receive a streaming AI response",
    description=(
        "Sends a user message to the conversation and receives an AI-generated response "
        "streamed back token-by-token using Server-Sent Events (SSE). "
        "The response is also persisted to the conversation history."
    ),
)
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    """
    Stream an AI response to the user's message.

    Returns a Server-Sent Events stream where each chunk is a text token.
    The full response is automatically persisted after the stream completes.

    A pre-flight ownership check is performed BEFORE the stream starts so that
    404/403 exceptions can surface as proper HTTP error responses rather than
    being swallowed into the SSE stream body.
    """
    service = ChatService(db)

    # Pre-flight: verify conversation exists and belongs to this user.
    # This raises NotFoundException (404) or AuthorizationException (403) eagerly,
    # before the StreamingResponse is constructed, so FastAPI can convert them
    # to proper HTTP error responses.
    await service.get_conversation(conversation_id=conversation_id, user_id=current_user.id)

    async def token_generator():
        """
        Async generator that yields SSE-formatted tokens from the chat service.
        Sends periodic SSE comment heartbeats while the pipeline is running so
        the browser doesn't close the connection during the silent 5-8s processing window.
        """
        import asyncio
        import json

        # Run the agentic pipeline in the background, collect tokens as they come
        stream = service.stream_response(
            conversation_id=conversation_id,
            user_id=current_user.id,
            user_message=payload.content,
        )

        # Use an async queue to bridge the pipeline and the SSE output
        queue: asyncio.Queue = asyncio.Queue()
        SENTINEL = object()

        async def producer():
            try:
                async for token in stream:
                    await queue.put(token)
            finally:
                await queue.put(SENTINEL)

        producer_task = asyncio.create_task(producer())

        try:
            while True:
                try:
                    # Wait up to 1 second for the next token
                    item = await asyncio.wait_for(queue.get(), timeout=1.0)
                    if item is SENTINEL:
                        break
                    token_json = json.dumps({"token": item})
                    yield f"data: {token_json}\n\n"
                except asyncio.TimeoutError:
                    # Send a keep-alive SSE comment to prevent connection timeout
                    yield ": heartbeat\n\n"
        finally:
            producer_task.cancel()

        # Signal stream end (both JSON and legacy string for total compatibility)
        yield 'data: {"done": true}\n\n'
        yield "data: [DONE]\n\n"

    logger.info(
        "Streaming response started",
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Generate Conversation Summary ────────────────────────────────────────────

@router.post(
    "/{conversation_id}/summary",
    response_model=ConversationSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate conversation summary",
    description=(
        "Uses the Groq LLM to generate a concise summary of the conversation. "
        "The summary is persisted and returned."
    ),
)
async def summarize_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConversationSummaryResponse:
    """Generate and persist a natural-language summary of the conversation."""
    service = ChatService(db)
    summary = await service.summarize_conversation(
        conversation_id=conversation_id, user_id=current_user.id
    )
    return ConversationSummaryResponse(
        conversation_id=conversation_id,
        summary=summary,
    )



# ─── Session Status ────────────────────────────────────────────────────────────

@router.get(
    "/{conversation_id}/session-status",
    response_model=SessionStatusOut,
    status_code=status.HTTP_200_OK,
    summary="Get session limit status for a conversation",
    description=(
        "Returns how many user messages have been sent and how many minutes the session "
        "has been active, together with the configured limits. "
        "The frontend uses this to show a session-limit warning banner."
    ),
)
async def get_session_status(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> SessionStatusOut:
    """Return current session usage vs configured limits."""
    service = ChatService(db)
    return await service.get_session_status(
        conversation_id=conversation_id, user_id=current_user.id
    )



# ─── Daily Usage ───────────────────────────────────────────────────────────────

@router.get(
    "/daily-usage",
    response_model=DailyUsageOut,
    status_code=status.HTTP_200_OK,
    summary="Get today's total message usage across all conversations",
    description=(
        "Returns how many messages the current user has sent today (UTC) "
        "across ALL their conversations, plus a soft daily limit for display. "
        "This is a transparency indicator only — it is not enforced server-side."
    ),
)
async def get_daily_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> DailyUsageOut:
    """Return today's message count vs soft daily limit for transparency display."""
    service = ChatService(db)
    return await service.get_daily_usage(user_id=current_user.id)
