"""
Emora Backend - Chat Module Tests

Tests for:
  - Starting conversations
  - Listing conversations
  - Deleting conversations
  - Retrieving message history
  - Searching conversations
  - Conversation summary
  - Streaming message endpoint

Uses in-memory SQLite and dependency overrides for isolation.
Groq API calls are mocked so no real AI calls are made during testing.
"""

from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

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


async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Override FastAPI DB dependency with in-memory test session."""
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
    """Create all tables and seed roles once per test session."""
    from app.models.user import Role
    import app.models  # noqa: F401

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        for role_name, description in [
            ("User", "Regular application user"),
            ("Counselor", "Mental health counselor"),
            ("Admin", "System administrator"),
        ]:
            role = Role(name=role_name, description=description)
            session.add(role)
        await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture()
def override_db():
    """Apply the DB override dependency for a single test."""
    app.dependency_overrides[get_db_session] = override_get_db_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture()
async def async_client(override_db):
    """Async HTTPX test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


# ─── Auth Helpers ─────────────────────────────────────────────────────────────

async def register_and_login(client: AsyncClient, email: str, password: str) -> str:
    """Helper: register a user and return their access token."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Test User", "password": password},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return login_resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Tests: Start Conversation ────────────────────────────────────────────────

class TestStartConversation:

    async def test_start_conversation_success(self, async_client: AsyncClient):
        """Creating a conversation returns 201 with conversation data."""
        token = await register_and_login(async_client, "conv1@test.com", "password123")
        response = await async_client.post(
            "/api/v1/chat",
            json={"title": "My First Chat"},
            headers=auth_headers(token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My First Chat"
        assert "id" in data

    async def test_start_conversation_default_title(self, async_client: AsyncClient):
        """Omitting title defaults to 'New Conversation'."""
        token = await register_and_login(async_client, "conv2@test.com", "password123")
        response = await async_client.post(
            "/api/v1/chat",
            json={},
            headers=auth_headers(token),
        )
        assert response.status_code == 201
        assert response.json()["title"] == "New Conversation"

    async def test_start_conversation_unauthenticated(self, async_client: AsyncClient):
        """Starting a conversation without a token returns 401."""
        response = await async_client.post("/api/v1/chat", json={"title": "Test"})
        assert response.status_code == 401


# ─── Tests: List Conversations ────────────────────────────────────────────────

class TestListConversations:

    async def test_list_conversations_empty(self, async_client: AsyncClient):
        """A new user has no conversations."""
        token = await register_and_login(async_client, "list1@test.com", "password123")
        response = await async_client.get("/api/v1/chat", headers=auth_headers(token))
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_conversations_returns_own(self, async_client: AsyncClient):
        """User only sees their own conversations."""
        token = await register_and_login(async_client, "list2@test.com", "password123")

        # Create two conversations
        await async_client.post("/api/v1/chat", json={"title": "Chat A"}, headers=auth_headers(token))
        await async_client.post("/api/v1/chat", json={"title": "Chat B"}, headers=auth_headers(token))

        response = await async_client.get("/api/v1/chat", headers=auth_headers(token))
        assert response.status_code == 200
        titles = [c["title"] for c in response.json()]
        assert "Chat A" in titles
        assert "Chat B" in titles

    async def test_list_conversations_unauthenticated(self, async_client: AsyncClient):
        """Accessing conversations without token returns 401."""
        response = await async_client.get("/api/v1/chat")
        assert response.status_code == 401


# ─── Tests: Get Message History ───────────────────────────────────────────────

class TestGetMessages:

    async def test_get_messages_empty_conversation(self, async_client: AsyncClient):
        """A new conversation has no messages."""
        token = await register_and_login(async_client, "msgs1@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Empty"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]
        response = await async_client.get(
            f"/api/v1/chat/{conv_id}/messages", headers=auth_headers(token)
        )
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_messages_other_user_forbidden(self, async_client: AsyncClient):
        """User cannot access another user's conversation messages."""
        token_a = await register_and_login(async_client, "msga@test.com", "password123")
        token_b = await register_and_login(async_client, "msgb@test.com", "password123")

        # User A creates a conversation
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Private"}, headers=auth_headers(token_a)
        )
        conv_id = conv.json()["id"]

        # User B tries to access it
        response = await async_client.get(
            f"/api/v1/chat/{conv_id}/messages", headers=auth_headers(token_b)
        )
        assert response.status_code == 403

    async def test_get_messages_nonexistent_conversation(self, async_client: AsyncClient):
        """Accessing a non-existent conversation returns 404."""
        token = await register_and_login(async_client, "msgs2@test.com", "password123")
        response = await async_client.get(
            "/api/v1/chat/999999/messages", headers=auth_headers(token)
        )
        assert response.status_code == 404


# ─── Tests: Delete Conversation ───────────────────────────────────────────────

class TestDeleteConversation:

    async def test_delete_conversation_success(self, async_client: AsyncClient):
        """Deleting own conversation returns 204."""
        token = await register_and_login(async_client, "del1@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "To Delete"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]

        response = await async_client.delete(
            f"/api/v1/chat/{conv_id}", headers=auth_headers(token)
        )
        assert response.status_code == 204

        # Verify it's gone
        list_resp = await async_client.get("/api/v1/chat", headers=auth_headers(token))
        assert not any(c["id"] == conv_id for c in list_resp.json())

    async def test_delete_other_user_conversation_forbidden(self, async_client: AsyncClient):
        """Deleting another user's conversation returns 403."""
        token_a = await register_and_login(async_client, "dela@test.com", "password123")
        token_b = await register_and_login(async_client, "delb@test.com", "password123")

        conv = await async_client.post(
            "/api/v1/chat", json={"title": "A's Chat"}, headers=auth_headers(token_a)
        )
        conv_id = conv.json()["id"]

        response = await async_client.delete(
            f"/api/v1/chat/{conv_id}", headers=auth_headers(token_b)
        )
        assert response.status_code == 403

    async def test_delete_nonexistent_conversation(self, async_client: AsyncClient):
        """Deleting a non-existent conversation returns 404."""
        token = await register_and_login(async_client, "del2@test.com", "password123")
        response = await async_client.delete(
            "/api/v1/chat/999999", headers=auth_headers(token)
        )
        assert response.status_code == 404


# ─── Tests: Search Conversations ─────────────────────────────────────────────

class TestSearchConversations:

    async def test_search_requires_authentication(self, async_client: AsyncClient):
        """Search without a token returns 401."""
        response = await async_client.get("/api/v1/chat/search?q=test")
        assert response.status_code == 401

    async def test_search_short_query_rejected(self, async_client: AsyncClient):
        """Search query shorter than 2 characters is rejected."""
        token = await register_and_login(async_client, "search1@test.com", "password123")
        response = await async_client.get(
            "/api/v1/chat/search?q=a", headers=auth_headers(token)
        )
        # FastAPI query validation should reject it
        assert response.status_code == 422

    async def test_search_no_results(self, async_client: AsyncClient):
        """Search with no matching messages returns empty results."""
        token = await register_and_login(async_client, "search2@test.com", "password123")
        response = await async_client.get(
            "/api/v1/chat/search?q=xyzzynonexistent123",
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "xyzzynonexistent123"
        assert data["results"] == []


# ─── Tests: Send Message (Streaming) ──────────────────────────────────────────

class TestSendMessage:

    @patch("app.services.chat_service.AsyncGroq")
    async def test_send_message_streams_response(
        self, mock_groq_cls, async_client: AsyncClient
    ):
        """
        Sending a message returns a 200 streaming response.
        Groq is mocked to return two tokens then stop.
        """
        # Set up mock stream
        mock_chunk_1 = MagicMock()
        mock_chunk_1.choices = [MagicMock(delta=MagicMock(content="Hello"))]
        mock_chunk_2 = MagicMock()
        mock_chunk_2.choices = [MagicMock(delta=MagicMock(content=" there!"))]

        async def fake_stream():
            for chunk in [mock_chunk_1, mock_chunk_2]:
                yield chunk

        mock_completion = MagicMock()
        mock_completion.__aiter__ = lambda self: fake_stream().__aiter__()

        mock_groq_instance = AsyncMock()
        mock_groq_instance.chat.completions.create = AsyncMock(
            return_value=mock_completion
        )
        mock_groq_cls.return_value = mock_groq_instance

        token = await register_and_login(async_client, "stream1@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Stream Test"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]

        response = await async_client.post(
            f"/api/v1/chat/{conv_id}/messages",
            json={"content": "Hi there!"},
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        # SSE content type
        assert "text/event-stream" in response.headers.get("content-type", "")

    async def test_send_message_to_nonexistent_conversation(
        self, async_client: AsyncClient
    ):
        """Sending a message to a non-existent conversation returns 404."""
        token = await register_and_login(async_client, "stream2@test.com", "password123")
        response = await async_client.post(
            "/api/v1/chat/999999/messages",
            json={"content": "Hello?"},
            headers=auth_headers(token),
        )
        assert response.status_code == 404

    async def test_send_message_empty_content_rejected(self, async_client: AsyncClient):
        """An empty message is rejected with 422."""
        token = await register_and_login(async_client, "stream3@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Empty msg"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]
        response = await async_client.post(
            f"/api/v1/chat/{conv_id}/messages",
            json={"content": ""},
            headers=auth_headers(token),
        )
        assert response.status_code == 422


# ─── Tests: Conversation Summary ──────────────────────────────────────────────

class TestConversationSummary:

    async def test_summarize_empty_conversation_fails(self, async_client: AsyncClient):
        """Summarizing an empty conversation returns 400."""
        token = await register_and_login(async_client, "summ1@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Empty"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]
        response = await async_client.post(
            f"/api/v1/chat/{conv_id}/summary", headers=auth_headers(token)
        )
        assert response.status_code == 400

    @patch("app.services.chat_service.AsyncGroq")
    async def test_summarize_conversation_success(
        self, mock_groq_cls, async_client: AsyncClient
    ):
        """
        Summarizing a conversation with messages returns 200 with a summary.
        The Groq call is mocked.
        """
        # Mock Groq for both streaming message and summary
        async def fake_stream():
            chunk = MagicMock()
            chunk.choices = [MagicMock(delta=MagicMock(content="I feel stressed today."))]
            yield chunk

        mock_stream_response = MagicMock()
        mock_stream_response.__aiter__ = lambda self: fake_stream().__aiter__()

        mock_summary_response = MagicMock()
        mock_summary_response.choices = [
            MagicMock(message=MagicMock(content="User expressed stress."))
        ]

        mock_groq_instance = AsyncMock()
        mock_groq_instance.chat.completions.create = AsyncMock(
            side_effect=[mock_stream_response, mock_summary_response]
        )
        mock_groq_cls.return_value = mock_groq_instance

        token = await register_and_login(async_client, "summ2@test.com", "password123")
        conv = await async_client.post(
            "/api/v1/chat", json={"title": "Stress Chat"}, headers=auth_headers(token)
        )
        conv_id = conv.json()["id"]

        # Send a message to populate the conversation
        await async_client.post(
            f"/api/v1/chat/{conv_id}/messages",
            json={"content": "I feel stressed today."},
            headers=auth_headers(token),
        )

        # Now summarize
        response = await async_client.post(
            f"/api/v1/chat/{conv_id}/summary", headers=auth_headers(token)
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert data["conversation_id"] == conv_id
