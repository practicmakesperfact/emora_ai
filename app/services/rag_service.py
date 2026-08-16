"""
Emora Backend - RAG Service
Implements a local Retrieval-Augmented Generation pipeline using:
  - LangChain RecursiveCharacterTextSplitter for chunking
  - Ollama nomic-embed-text for embeddings (local, offline)
  - ChromaDB as the vector store
  - Metadata filtering and source citations
"""

from typing import List
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.document import RAGSearchResult

logger = get_logger(__name__)

CHROMA_COLLECTION_NAME = "emora_knowledge_base"


def _get_chroma_client():
    """Lazy-initialize ChromaDB persistent client."""
    import chromadb
    return chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)


def _get_embedding_function():
    """Return local Ollama embedding function using nomic-embed-text."""
    from chromadb.utils.embedding_functions import OllamaEmbeddingFunction
    return OllamaEmbeddingFunction(
        url=f"{settings.OLLAMA_BASE_URL}/api/embeddings",
        model_name=settings.EMBEDDING_MODEL,
    )


class RAGService:
    """Service for indexing documents into ChromaDB and running similarity searches."""

    def __init__(self) -> None:
        self._client = _get_chroma_client()
        self._ef = _get_embedding_function()
        self._collection = self._client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            embedding_function=self._ef,
        )

    def index_document(
        self,
        document_id: int,
        title: str,
        source: str | None,
        content: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> int:
        """
        Chunk content using RecursiveCharacterTextSplitter and upsert into ChromaDB.
        Returns the number of chunks indexed.
        """
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        chunks = splitter.split_text(content)

        if not chunks:
            logger.warning("No chunks produced for document", doc_id=document_id)
            return 0

        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": str(document_id),
                "title": title,
                "source": source or "Unknown",
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]

        self._collection.upsert(
            documents=chunks,
            ids=ids,
            metadatas=metadatas,
        )
        logger.info(
            "Document indexed in ChromaDB",
            doc_id=document_id,
            chunks=len(chunks),
        )
        return len(chunks)

    def search(self, query: str, n_results: int = 5) -> List[RAGSearchResult]:
        """
        Perform a similarity search in ChromaDB.
        Returns a list of RAGSearchResult with content, source, title, and score.
        """
        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=n_results,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as e:
            logger.error("ChromaDB search failed", error=str(e))
            return []

        search_results: List[RAGSearchResult] = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for doc, meta, dist in zip(documents, metadatas, distances):
            # Convert distance to similarity score (lower distance = higher score)
            similarity = round(1 - dist, 4) if dist is not None else 0.0
            search_results.append(
                RAGSearchResult(
                    content=doc,
                    source=meta.get("source", "Unknown"),
                    title=meta.get("title", "Unknown"),
                    score=similarity,
                )
            )

        logger.info(
            "RAG search completed",
            query=query,
            results_count=len(search_results),
        )
        return search_results

    def delete_document_chunks(self, document_id: int) -> None:
        """Remove all ChromaDB chunks associated with a document_id."""
        try:
            results = self._collection.get(
                where={"document_id": str(document_id)},
            )
            ids_to_delete = results.get("ids", [])
            if ids_to_delete:
                self._collection.delete(ids=ids_to_delete)
                logger.info(
                    "Document chunks removed from ChromaDB",
                    doc_id=document_id,
                    chunks_removed=len(ids_to_delete),
                )
        except Exception as e:
            logger.error("Failed to delete document chunks from ChromaDB", error=str(e))
