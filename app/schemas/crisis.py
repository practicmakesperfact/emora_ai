"""
Emora Backend - Crisis Schemas
Pydantic v2 schemas for incident logging and counselor review.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class IncidentOut(BaseModel):
    id: int
    user_id: int
    conversation_id: Optional[int] = None
    message_content: str
    risk_level: str
    action_taken: str
    resolved: bool
    counselor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentResolve(BaseModel):
    """Schema for a counselor resolving an incident with optional notes."""
    counselor_notes: Optional[str] = None
