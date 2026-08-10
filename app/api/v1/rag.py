"""
Emora Backend - RAG Search API Router

Routes:
  GET  /api/v1/rag/search   - Perform a similarity search over the knowledge base

Requires authentication. Returns source-cited results from ChromaDB.
"""

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.document import RAGSearchResponse
from app.services.rag_service import RAGService

logger = get_logger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.get(
    "/search",
    response_model=RAGSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search the knowledge base",
    description=(
        "Performs a semantic similarity search over all indexed knowledge documents. "
        "Returns the most relevant chunks with source citations."
    ),
)
async def search_knowledge_base(
    q: str = Query(..., min_length=3, description="Search query string"),
    n_results: int = Query(default=5, ge=1, le=20, description="Number of results to return"),
    current_user: User = Depends(get_current_user),
) -> RAGSearchResponse:
    """Run a similarity search over the ChromaDB knowledge base."""
    rag_service = RAGService()
    results = rag_service.search(query=q, n_results=n_results)
    logger.info(
        "RAG search via API",
        user_id=current_user.id,
        query=q,
        results_count=len(results),
    )
    return RAGSearchResponse(query=q, results=results)
