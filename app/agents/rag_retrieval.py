"""
RAG Retrieval Agent
Queries ChromaDB for relevant knowledge chunks to augment the AI response.
"""

from app.core.logging import get_logger
from app.services.rag_service import RAGService

logger = get_logger(__name__)

RAG_RESULTS_LIMIT = 3
RELEVANCE_THRESHOLD = 0.3  # Only include results with score above this threshold


async def rag_retrieval_node(state: dict) -> dict:
    """
    Performs a similarity search in ChromaDB using the user's message.
    Appends high-relevance results to rag_context with source citations.
    Sets: rag_context
    """
    rag_service = RAGService()
    results = rag_service.search(query=state["user_message"], n_results=RAG_RESULTS_LIMIT)

    rag_context = ""
    if results:
        relevant = [r for r in results if r.score >= RELEVANCE_THRESHOLD]
        if relevant:
            chunks = []
            for r in relevant:
                chunks.append(
                    f'[Source: "{r.title}" - {r.source}]\n{r.content}'
                )
            rag_context = "Relevant knowledge base excerpts:\n\n" + "\n\n---\n\n".join(chunks)
            logger.debug(
                "RAG context retrieved",
                chunks=len(relevant),
                query=state["user_message"][:50],
            )

    return {**state, "rag_context": rag_context}
