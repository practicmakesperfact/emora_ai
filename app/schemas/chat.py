from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Content of the user message")

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    sentiment: Optional[str] = None
    intent: Optional[str] = None
    source_citations: Optional[Dict[str, Any]] = None
    is_crisis_triggered: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="New Conversation", max_length=200)

class ConversationRename(BaseModel):
    """Body for PATCH /chat/{id}/rename"""
    title: str = Field(..., min_length=1, max_length=100)

class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    summary: Optional[str] = None

class ConversationOut(BaseModel):
    id: int
    user_id: int
    title: str
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationSummaryResponse(BaseModel):
    conversation_id: int
    summary: str

class SearchResult(BaseModel):
    message_id: int
    conversation_id: int
    conversation_title: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationSearchResponse(BaseModel):
    query: str
    results: List[SearchResult]


class SessionStatusOut(BaseModel):
    """Returned by GET /chat/{id}/session-status to let the frontend show limit warnings."""
    conversation_id: int
    user_message_count: int
    max_messages: int
    session_age_minutes: int
    max_duration_minutes: int
    messages_remaining: int
    minutes_remaining: int
    is_message_limit_reached: bool
    is_duration_limit_reached: bool
    is_limit_reached: bool


class DailyUsageOut(BaseModel):
    """
    Returned by GET /chat/daily-usage.
    Shows how many messages the user has sent today across all conversations.
    Used by the frontend to display a soft transparency indicator.
    """
    messages_today: int
    daily_soft_limit: int          # Informational — not enforced server-side
    usage_percent: float           # 0.0 – 100.0
    is_approaching_limit: bool     # True when > 80 % used
