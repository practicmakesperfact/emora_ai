# app/models/__init__.py
# Imports all ORM models so SQLAlchemy can register them with Base.metadata
from app.models.user import User, Role
from app.models.conversation import Conversation, Message
from app.models.memory import Memory
from app.models.mood import MoodLog
from app.models.journal import Journal
from app.models.document import KnowledgeDocument, UploadedFile
from app.models.crisis import Incident
from app.models.sentiment import SentimentLog
from app.models.notification import Notification

__all__ = [
    "User", "Role",
    "Conversation", "Message",
    "Memory",
    "MoodLog",
    "Journal",
    "KnowledgeDocument", "UploadedFile",
    "Incident",
    "SentimentLog",
    "Notification",
]
