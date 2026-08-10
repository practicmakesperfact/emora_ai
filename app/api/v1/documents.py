"""
Emora Backend - Documents API Router

Routes:
  POST   /api/v1/documents/upload     - Upload a knowledge document (Admin only)
  GET    /api/v1/documents            - List all documents (Admin only)
  DELETE /api/v1/documents/{doc_id}   - Delete a document (Admin only)

All endpoints require Admin role.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.logging import get_logger
from app.database.connection import get_db_session
from app.schemas.document import DocumentOut
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService

logger = get_logger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
    dependencies=[Depends(require_admin)],
)


@router.post(
    "/upload",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a knowledge document",
    description=(
        "Upload a PDF, DOCX, TXT, or MD file. Extracts text, chunks it, generates embeddings "
        "via local Ollama, and stores vectors in ChromaDB for RAG. Admin only."
    ),
)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, TXT, or MD)"),
    title: str = Form(..., description="Document title"),
    author: str | None = Form(default=None, description="Author name"),
    source: str | None = Form(default=None, description="Source (e.g., WHO, APA)"),
    db: AsyncSession = Depends(get_db_session),
) -> DocumentOut:
    """Upload and index a knowledge document."""
    doc_service = DocumentService(db)
    document = await doc_service.upload_document(
        file=file, title=title, author=author, source=source
    )

    # Index in ChromaDB for RAG (runs synchronously - small docs are fine locally)
    if document.content:
        rag_service = RAGService()
        chunks = rag_service.index_document(
            document_id=document.id,
            title=document.title,
            source=document.source,
            content=document.content,
        )
        logger.info("Document indexed in ChromaDB", doc_id=document.id, chunks=chunks)

    return document


@router.get(
    "",
    response_model=List[DocumentOut],
    status_code=status.HTTP_200_OK,
    summary="List all knowledge documents",
    description="Retrieve a paginated list of all uploaded knowledge documents. Admin only.",
)
async def list_documents(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db_session),
) -> List[DocumentOut]:
    """List all uploaded knowledge documents."""
    doc_service = DocumentService(db)
    docs = await doc_service.list_documents(skip=skip, limit=limit)
    return list(docs)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a knowledge document",
    description="Deletes the document from the database, disk, and ChromaDB vector store. Admin only.",
)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a knowledge document and its ChromaDB chunks."""
    doc_service = DocumentService(db)
    # Remove ChromaDB chunks first
    rag_service = RAGService()
    rag_service.delete_document_chunks(document_id)
    await doc_service.delete_document(document_id)
