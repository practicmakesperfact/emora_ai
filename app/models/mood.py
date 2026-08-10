from datetime import datetime
from typing import Optional, List
from sqlalchemy import DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class MoodLog(Base):
    __tablename__ = "mood_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False) # 1-10 (1=Very bad, 10=Excellent)
    mood_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotions: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True) # ["anxious", "sad", "stressed"]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="mood_logs")
