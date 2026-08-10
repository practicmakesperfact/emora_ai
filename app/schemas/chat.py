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
