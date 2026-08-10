from datetime import datetime
from typing import Optional, List
from sqlalchemy import DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Journal(Base):
    __tablename__ = "journals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotions: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True) # ["stress", "anxiety"]
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True) # ["exam", "sleep", "grades"]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="journals")
