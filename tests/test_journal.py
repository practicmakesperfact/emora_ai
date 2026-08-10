"""
Emora Backend - Journal Module Tests
Tests for: create entry (with mocked AI), get history, get by ID, delete.
Uses pytest-asyncio with an in-memory SQLite database for isolation.
"""

import pytest
from unittest.mock import AsyncMock, patch
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
    """Create all tables and seed roles before journal tests."""
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

async def register_and_login(client: AsyncClient, email: str = "journaltester@example.com") -> str:
    """Register a user and return an access token."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Journal Tester", "password": "pass1234!"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "pass1234!"},
    )
    return resp.json()["access_token"]


# Fake AI analysis result to bypass real Groq calls in tests
FAKE_ANALYSIS = {
    "summary": "Test summary of the journal entry.",
    "emotions": ["Calm", "Hopeful"],
    "keywords": ["test", "journal", "entry"],
}


# ─── Create Journal Entry ────────────────────────────────────────────────────

class TestCreateJournalEntry:

    async def test_create_entry_success(self, async_client: AsyncClient):
        """A valid journal entry returns 201 with AI analysis fields."""
        token = await register_and_login(async_client, "journal_create@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            resp = await async_client.post(
                "/api/v1/journal",
                headers={"Authorization": f"Bearer {token}"},
                json={"content": "Today I felt calm and grateful for small things."},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Today I felt calm and grateful for small things."
        assert "id" in data
        assert "user_id" in data

    async def test_create_entry_without_auth_fails(self, async_client: AsyncClient):
        """Creating a journal entry without a token returns 401."""
        resp = await async_client.post(
            "/api/v1/journal",
            json={"content": "No auth entry."},
        )
        assert resp.status_code == 401

    async def test_create_entry_empty_content_fails(self, async_client: AsyncClient):
        """An empty content string is rejected by validation."""
        token = await register_and_login(async_client, "journal_empty@example.com")
        resp = await async_client.post(
            "/api/v1/journal",
            headers={"Authorization": f"Bearer {token}"},
            json={"content": ""},
        )
        assert resp.status_code == 422


# ─── Get Journal History ──────────────────────────────────────────────────────

class TestJournalHistory:

    async def test_get_history_empty(self, async_client: AsyncClient):
        """A new user with no entries returns an empty list."""
        token = await register_and_login(async_client, "journal_history@example.com")
        resp = await async_client.get(
            "/api/v1/journal/history",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_get_history_with_entries(self, async_client: AsyncClient):
        """After creating entries, history returns them."""
        token = await register_and_login(async_client, "journal_histlist@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            for i in range(3):
                await async_client.post(
                    "/api/v1/journal",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"content": f"Entry number {i + 1}"},
                )

        resp = await async_client.get(
            "/api/v1/journal/history",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    async def test_history_without_auth_fails(self, async_client: AsyncClient):
        """History endpoint without token returns 401."""
        resp = await async_client.get("/api/v1/journal/history")
        assert resp.status_code == 401


# ─── Get Journal Entry by ID ──────────────────────────────────────────────────

class TestGetJournalEntryById:

    async def test_get_entry_by_id_success(self, async_client: AsyncClient):
        """Fetching an entry by ID returns the correct entry."""
        token = await register_and_login(async_client, "journal_getbyid@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            create_resp = await async_client.post(
                "/api/v1/journal",
                headers={"Authorization": f"Bearer {token}"},
                json={"content": "Specific entry for ID fetch."},
            )

        entry_id = create_resp.json()["id"]
        resp = await async_client.get(
            f"/api/v1/journal/{entry_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == entry_id

    async def test_get_nonexistent_entry_fails(self, async_client: AsyncClient):
        """Fetching an ID that doesn't exist returns 404."""
        token = await register_and_login(async_client, "journal_notfound@example.com")
        resp = await async_client.get(
            "/api/v1/journal/99999",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404


# ─── Delete Journal Entry ────────────────────────────────────────────────────

class TestDeleteJournalEntry:

    async def test_delete_entry_success(self, async_client: AsyncClient):
        """Deleting an owned entry returns 204."""
        token = await register_and_login(async_client, "journal_delete@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            create_resp = await async_client.post(
                "/api/v1/journal",
                headers={"Authorization": f"Bearer {token}"},
                json={"content": "Entry to be deleted."},
            )

        entry_id = create_resp.json()["id"]
        resp = await async_client.delete(
            f"/api/v1/journal/{entry_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 204

    async def test_delete_then_get_returns_404(self, async_client: AsyncClient):
        """After deletion, fetching the same entry returns 404."""
        token = await register_and_login(async_client, "journal_delete2@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            create_resp = await async_client.post(
                "/api/v1/journal",
                headers={"Authorization": f"Bearer {token}"},
                json={"content": "Delete me, then check."},
            )

        entry_id = create_resp.json()["id"]
        await async_client.delete(
            f"/api/v1/journal/{entry_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = await async_client.get(
            f"/api/v1/journal/{entry_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    async def test_delete_other_users_entry_fails(self, async_client: AsyncClient):
        """Attempting to delete another user's entry returns 403 or 404."""
        token_owner = await register_and_login(async_client, "journal_owner@example.com")
        token_other = await register_and_login(async_client, "journal_thief@example.com")

        with patch(
            "app.services.journal_service.JournalService._analyze_entry",
            new_callable=AsyncMock,
            return_value=FAKE_ANALYSIS,
        ):
            create_resp = await async_client.post(
                "/api/v1/journal",
                headers={"Authorization": f"Bearer {token_owner}"},
                json={"content": "This belongs to the owner."},
            )

        entry_id = create_resp.json()["id"]
        resp = await async_client.delete(
            f"/api/v1/journal/{entry_id}",
            headers={"Authorization": f"Bearer {token_other}"},
        )
        assert resp.status_code in (403, 404)
