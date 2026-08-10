from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Content of the journal entry")

class JournalOut(BaseModel):
    id: int
    user_id: int
    content: str
    ai_summary: Optional[str] = None
    emotions: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JournalSummaryResponse(BaseModel):
    journal_id: int
    ai_summary: str
    emotions: List[str]
    keywords: List[str]
