"""
Emora Backend - Messages Router Tests

Tests for:
  - GET /api/v1/messages (List recent messages across all conversations)
  - GET /api/v1/messages/{message_id} (Retrieve a message by ID with ownership check)
  - DELETE /api/v1/messages/{message_id} (Delete a message by ID with ownership check)
"""

from typing import AsyncGenerator
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.connection import get_db_session
from app.main import app
from app.models.user import Role
from app.repositories.conversation import ConversationRepository

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
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="module", autouse=True)
async def setup_test_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        for role_name, description in [
            ("User", "Regular user"),
            ("Counselor", "Counselor"),
            ("Admin", "Admin"),
        ]:
            role = Role(name=role_name, description=description)
            session.add(role)
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


# ─── Auth Helpers ─────────────────────────────────────────────────────────────

async def register_and_login(client: AsyncClient, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Test User", "password": "password123"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return login_resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Tests ────────────────────────────────────────────────────────────────────

class TestMessagesRouter:

    async def test_list_recent_messages_empty(self, async_client: AsyncClient):
        """Listing recent messages when none exist returns empty list."""
        token = await register_and_login(async_client, "msg_test1@test.com")
        response = await async_client.get("/api/v1/messages", headers=auth_headers(token))
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_recent_messages_success(self, async_client: AsyncClient):
        """Listing recent messages returns messages from conversations owned by user."""
        token = await register_and_login(async_client, "msg_test2@test.com")
        
        # Create a conversation
        conv_res = await async_client.post(
            "/api/v1/chat",
            json={"title": "Test Chat"},
            headers=auth_headers(token),
        )
        conv_id = conv_res.json()["id"]

        # Insert some messages using the database session
        async with TestSessionLocal() as session:
            repo = ConversationRepository(session)
            await repo.create_message(conversation_id=conv_id, role="user", content="Hello Emora")
            await repo.create_message(conversation_id=conv_id, role="assistant", content="Hello, how can I help you?")
            await session.commit()

        # Call endpoint
        response = await async_client.get("/api/v1/messages?limit=10", headers=auth_headers(token))
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["content"] == "Hello, how can I help you?"
        assert data[0]["role"] == "assistant"
        assert data[1]["content"] == "Hello Emora"
        assert data[1]["role"] == "user"

    async def test_get_message_by_id_success(self, async_client: AsyncClient):
        """Retrieving a specific message by ID works if the user owns it."""
        token = await register_and_login(async_client, "msg_test3@test.com")
        
        conv_res = await async_client.post(
            "/api/v1/chat",
            json={"title": "Test Chat 2"},
            headers=auth_headers(token),
        )
        conv_id = conv_res.json()["id"]

        async with TestSessionLocal() as session:
            repo = ConversationRepository(session)
            msg = await repo.create_message(conversation_id=conv_id, role="user", content="Find me by ID")
            msg_id = msg.id
            await session.commit()

        response = await async_client.get(f"/api/v1/messages/{msg_id}", headers=auth_headers(token))
        assert response.status_code == 200
        assert response.json()["content"] == "Find me by ID"
        assert response.json()["id"] == msg_id

    async def test_get_message_by_id_unauthorized(self, async_client: AsyncClient):
        """Retrieving another user's message returns 403."""
        token_a = await register_and_login(async_client, "msg_test4a@test.com")
        token_b = await register_and_login(async_client, "msg_test4b@test.com")

        conv_res = await async_client.post(
            "/api/v1/chat",
            json={"title": "Private Chat"},
            headers=auth_headers(token_a),
        )
        conv_id = conv_res.json()["id"]

        async with TestSessionLocal() as session:
            repo = ConversationRepository(session)
            msg = await repo.create_message(conversation_id=conv_id, role="user", content="Secret message")
            msg_id = msg.id
            await session.commit()

        response = await async_client.get(f"/api/v1/messages/{msg_id}", headers=auth_headers(token_b))
        assert response.status_code == 403

    async def test_get_message_by_id_nonexistent(self, async_client: AsyncClient):
        """Retrieving a nonexistent message returns 404."""
        token = await register_and_login(async_client, "msg_test5@test.com")
        response = await async_client.get("/api/v1/messages/999999", headers=auth_headers(token))
        assert response.status_code == 404

    async def test_delete_message_success(self, async_client: AsyncClient):
        """Deleting a message works if the user owns it."""
        token = await register_and_login(async_client, "msg_test6@test.com")

        conv_res = await async_client.post(
            "/api/v1/chat",
            json={"title": "Delete Chat"},
            headers=auth_headers(token),
        )
        conv_id = conv_res.json()["id"]

        async with TestSessionLocal() as session:
            repo = ConversationRepository(session)
            msg = await repo.create_message(conversation_id=conv_id, role="user", content="Temporary message")
            msg_id = msg.id
            await session.commit()

        # Delete it
        del_res = await async_client.delete(f"/api/v1/messages/{msg_id}", headers=auth_headers(token))
        assert del_res.status_code == 204

        # Verify it's gone
        get_res = await async_client.get(f"/api/v1/messages/{msg_id}", headers=auth_headers(token))
        assert get_res.status_code == 404

    async def test_delete_message_unauthorized(self, async_client: AsyncClient):
        """Deleting another user's message returns 403."""
        token_a = await register_and_login(async_client, "msg_test7a@test.com")
        token_b = await register_and_login(async_client, "msg_test7b@test.com")

        conv_res = await async_client.post(
            "/api/v1/chat",
            json={"title": "Owner Chat"},
            headers=auth_headers(token_a),
        )
        conv_id = conv_res.json()["id"]

        async with TestSessionLocal() as session:
            repo = ConversationRepository(session)
            msg = await repo.create_message(conversation_id=conv_id, role="user", content="Do not delete me")
            msg_id = msg.id
            await session.commit()

        # Try to delete it as User B
        del_res = await async_client.delete(f"/api/v1/messages/{msg_id}", headers=auth_headers(token_b))
        assert del_res.status_code == 403

    async def test_delete_message_nonexistent(self, async_client: AsyncClient):
        """Deleting a nonexistent message returns 404."""
        token = await register_and_login(async_client, "msg_test8@test.com")
        response = await async_client.delete("/api/v1/messages/999999", headers=auth_headers(token))
        assert response.status_code == 404
