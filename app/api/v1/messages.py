"""
Emora Backend - Messages API Router

Provides direct message-level access independent of the chat/conversation router.

Routes:
  GET    /api/v1/messages                    - List recent messages across all user conversations
  GET    /api/v1/messages/{message_id}       - Get a specific message by ID
  DELETE /api/v1/messages/{message_id}       - Delete a specific message

All endpoints require authentication (Bearer token).
Users can only access their own messages.
"""

from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException, AuthorizationException
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.models.user import User
from app.repositories.conversation import ConversationRepository
from app.schemas.chat import MessageOut

logger = get_logger(__name__)

router = APIRouter(prefix="/messages", tags=["Messages"])


# ─── List Recent Messages ─────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[MessageOut],
    status_code=status.HTTP_200_OK,
    summary="List recent messages across all conversations",
    description=(
        "Returns the most recent messages across all of the authenticated user's "
        "conversations, sorted newest first. Useful for a global message feed or "
        "activity timeline."
    ),
)
async def list_recent_messages(
    limit: int = Query(default=50, ge=1, le=200, description="Maximum messages to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[MessageOut]:
    """Retrieve recent messages across all conversations for the authenticated user."""
    repo = ConversationRepository(db)
    messages = await repo.get_recent_messages_for_user(
        user_id=current_user.id, limit=limit
    )
    logger.info(
        "Recent messages fetched",
        user_id=current_user.id,
        count=len(messages),
    )
    return list(messages)


# ─── Get Message by ID ────────────────────────────────────────────────────────

@router.get(
    "/{message_id}",
    response_model=MessageOut,
    status_code=status.HTTP_200_OK,
    summary="Get a specific message by ID",
    description="Retrieve a single message by its ID. The message must belong to the authenticated user.",
)
async def get_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MessageOut:
    """Fetch a single message by ID, enforcing ownership via its conversation."""
    repo = ConversationRepository(db)

    message = await repo.get_message_by_id(message_id)
    if not message:
        raise NotFoundException(f"Message {message_id} not found.")

    # Verify the message belongs to a conversation owned by this user
    conversation = await repo.get_conversation_by_id(message.conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise AuthorizationException("You do not have access to this message.")

    logger.info("Message fetched by ID", message_id=message_id, user_id=current_user.id)
    return message


# ─── Delete Message by ID ────────────────────────────────────────────────────

@router.delete(
    "/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a specific message",
    description=(
        "Permanently deletes a single message by its ID. "
        "The message must belong to the authenticated user."
    ),
)
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a single message after verifying ownership."""
    repo = ConversationRepository(db)

    message = await repo.get_message_by_id(message_id)
    if not message:
        raise NotFoundException(f"Message {message_id} not found.")

    # Verify ownership via conversation
    conversation = await repo.get_conversation_by_id(message.conversation_id)
    if not conversation or conversation.user_id != current_user.id:
        raise AuthorizationException("You do not have permission to delete this message.")

    await repo.delete_message(message)
    logger.info("Message deleted", message_id=message_id, user_id=current_user.id)
