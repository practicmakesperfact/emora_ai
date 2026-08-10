"""
Emora Backend - Document & RAG Schemas
Pydantic v2 schemas for document upload, metadata, and RAG search results.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    source: Optional[str] = None
    upload_date: datetime
    file_name: str

    model_config = ConfigDict(from_attributes=True)


class RAGSearchResult(BaseModel):
    """Represents a single similarity search result with source citation."""
    content: str
    source: str
    title: str
    score: float


class RAGSearchResponse(BaseModel):
    query: str
    results: List[RAGSearchResult]
