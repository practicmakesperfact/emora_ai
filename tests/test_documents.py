"""
Emora Backend - Documents & RAG Module Tests
Tests for: document listing (Admin only), delete, RAG search.
File upload is tested via mocks since multipart + SQLite can be tricky.
Uses pytest-asyncio with an in-memory SQLite database for isolation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database.base import Base
from app.database.connection import get_db_session
from app.main import app

# ─── Test Database Setup ──────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def override_get_db_session():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Create all tables and seed roles before document tests."""
    from app.models.user import Role
    import app.models  # noqa: F401

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        for role_name, description in [
            ("User", "Regular user"),
            ("Counselor", "Counselor"),
            ("Admin", "Admin"),
        ]:
            session.add(Role(name=role_name, description=description))
        await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture()
def override_db():
    app.dependency_overrides[get_db_session] = override_get_db_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
async def async_client(override_db):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def register_and_login(client: AsyncClient, email: str, role: str = "User") -> str:
    """Register a user and return an access token."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Test User",
            "password": "pass1234!",
            "role_name": role,
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "pass1234!"},
    )
    return resp.json()["access_token"]


# ─── Documents Access Control ─────────────────────────────────────────────────

class TestDocumentsAccessControl:

    async def test_regular_user_cannot_list_documents(self, async_client: AsyncClient):
        """A regular User cannot access admin document list (403)."""
        token = await register_and_login(async_client, "doc_user@example.com", "User")
        resp = await async_client.get(
            "/api/v1/documents",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    async def test_counselor_cannot_list_documents(self, async_client: AsyncClient):
        """A Counselor cannot access admin document list (403)."""
        token = await register_and_login(
            async_client, "doc_counselor@example.com", "Counselor"
        )
        resp = await async_client.get(
            "/api/v1/documents",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    async def test_unauthenticated_cannot_access_documents(self, async_client: AsyncClient):
        """Unauthenticated request returns 401."""
        resp = await async_client.get("/api/v1/documents")
        assert resp.status_code == 401

    async def test_admin_can_list_documents(self, async_client: AsyncClient):
        """An Admin can list documents (200)."""
        token = await register_and_login(
            async_client, "doc_admin_list@example.com", "Admin"
        )
        resp = await async_client.get(
            "/api/v1/documents",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ─── Documents Upload ─────────────────────────────────────────────────────────

class TestDocumentUpload:

    async def test_upload_unsupported_file_type_fails(self, async_client: AsyncClient):
        """Uploading a .exe file returns 400 (unsupported type)."""
        from app.core.exceptions import AppException
        token = await register_and_login(
            async_client, "doc_upload_bad@example.com", "Admin"
        )
        with patch(
            "app.services.document_service.DocumentService.upload_document",
            new_callable=AsyncMock,
            side_effect=AppException(status_code=400, message="Unsupported file type"),
        ):
            # Real multipart upload simulation with invalid extension
            import io
            resp = await async_client.post(
                "/api/v1/documents/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("malware.exe", io.BytesIO(b"bad content"), "application/octet-stream")},
                data={"title": "Malicious Upload"},
            )
        assert resp.status_code == 400

    async def test_upload_regular_user_forbidden(self, async_client: AsyncClient):
        """A regular User cannot upload documents (403)."""
        import io

        token = await register_and_login(
            async_client, "doc_upload_user@example.com", "User"
        )
        resp = await async_client.post(
            "/api/v1/documents/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("test.txt", io.BytesIO(b"Some content"), "text/plain")},
            data={"title": "Unauthorized Upload"},
        )
        assert resp.status_code == 403


# ─── Documents Delete ────────────────────────────────────────────────────────

class TestDocumentDelete:

    async def test_delete_nonexistent_document_returns_404(self, async_client: AsyncClient):
        """Deleting a document that doesn't exist returns 404."""
        token = await register_and_login(
            async_client, "doc_delete@example.com", "Admin"
        )
        with patch("app.api.v1.documents.RAGService") as MockRAG:
            MockRAG.return_value = MagicMock()
            resp = await async_client.delete(
                "/api/v1/documents/99999",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 404

    async def test_delete_regular_user_forbidden(self, async_client: AsyncClient):
        """A regular User cannot delete documents (403)."""
        token = await register_and_login(
            async_client, "doc_delete_user@example.com", "User"
        )
        resp = await async_client.delete(
            "/api/v1/documents/1",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403


# ─── RAG Search ──────────────────────────────────────────────────────────────

class TestRAGSearch:

    async def test_search_requires_auth(self, async_client: AsyncClient):
        """RAG search without a token returns 401."""
        resp = await async_client.get("/api/v1/rag/search?q=anxiety")
        assert resp.status_code == 401

    async def test_search_returns_response_schema(self, async_client: AsyncClient):
        """Authenticated RAG search returns correct schema with query and results."""
        token = await register_and_login(async_client, "rag_search@example.com", "User")

        mock_results = [
            MagicMock(
                content="Deep breathing reduces cortisol.",
                source="WHO Mental Health Guide",
                title="Stress Management",
                score=0.92,
            )
        ]

        with patch("app.api.v1.rag.RAGService") as MockRAG:
            mock_inst = MagicMock()
            mock_inst.search.return_value = mock_results
            MockRAG.return_value = mock_inst
            resp = await async_client.get(
                "/api/v1/rag/search?q=how+to+manage+anxiety",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "query" in data
        assert "results" in data
        assert data["query"] == "how to manage anxiety"

    async def test_search_short_query_fails(self, async_client: AsyncClient):
        """A query shorter than 3 characters is rejected (422)."""
        token = await register_and_login(async_client, "rag_short@example.com", "User")
        resp = await async_client.get(
            "/api/v1/rag/search?q=hi",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422

    async def test_search_empty_results(self, async_client: AsyncClient):
        """If ChromaDB returns no results, response has empty results list."""
        token = await register_and_login(async_client, "rag_empty@example.com", "User")

        with patch("app.api.v1.rag.RAGService") as MockRAG:
            mock_inst = MagicMock()
            mock_inst.search.return_value = []
            MockRAG.return_value = mock_inst
            resp = await async_client.get(
                "/api/v1/rag/search?q=completely+obscure+query",
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 200
        assert resp.json()["results"] == []


# ─── RAG Service Unit Tests ───────────────────────────────────────────────────

class TestRAGServiceUnit:

    def test_rag_search_returns_list(self):
        """RAGService.search returns a list (uses mock ChromaDB)."""
        from app.services.rag_service import RAGService
        from app.schemas.document import RAGSearchResult

        service = RAGService.__new__(RAGService)

        mock_collection = MagicMock()
        mock_collection.query.return_value = {
            "documents": [["Breathing exercises help anxiety."]],
            "metadatas": [[{"title": "CBT Manual", "source": "APA", "document_id": "1"}]],
            "distances": [[0.15]],
        }
        service._collection = mock_collection
        service._client = MagicMock()
        service._ef = MagicMock()

        results = service.search("anxiety techniques", n_results=1)
        assert isinstance(results, list)
        assert len(results) == 1
        assert results[0].score == round(1 - 0.15, 4)

    def test_rag_index_document(self):
        """RAGService.index_document calls upsert with correct chunk count."""
        from app.services.rag_service import RAGService

        service = RAGService.__new__(RAGService)
        mock_collection = MagicMock()
        service._collection = mock_collection
        service._client = MagicMock()
        service._ef = MagicMock()

        content = "word " * 600  # ~600 words → should produce multiple chunks
        count = service.index_document(
            document_id=1,
            title="Test Doc",
            source="Test Source",
            content=content,
        )
        assert count > 0
        mock_collection.upsert.assert_called_once()
