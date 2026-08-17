from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    conversation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("conversations.id"), nullable=True)
    message_content: Mapped[str] = mapped_column(Text, nullable=False) # The user input that triggered the crisis
    risk_level: Mapped[str] = mapped_column(String(50), nullable=False) # "Low", "Medium", "High", "Critical"
    action_taken: Mapped[str] = mapped_column(Text, nullable=False) # Action details e.g., "Crisis hotline shown"
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    counselor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="incidents")
    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation")
