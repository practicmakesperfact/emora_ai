from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class SentimentLog(Base):
    __tablename__ = "sentiment_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    conversation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("conversations.id"), nullable=True)
    message_id: Mapped[Optional[int]] = mapped_column(ForeignKey("messages.id"), nullable=True)
    sentiment: Mapped[str] = mapped_column(String(50), nullable=False) # "Happiness", "Sadness", "Anxiety", etc.
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sentiment_logs")
    message: Mapped[Optional["Message"]] = relationship("Message")
