"""
Emora Backend - Authentication & User Tests
Tests for: registration, login, token creation, user profile management.
Uses pytest-asyncio with an in-memory SQLite database for isolation.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database.base import Base
from app.database.connection import get_db_session
from app.main import app

# ─── Test Database Setup ──────────────────────────────────────────────────────

# Use an in-memory SQLite async database for testing
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
    """Override FastAPI DB dependency to use the in-memory test database."""
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
    """Create all tables and seed roles before any test runs."""
    from app.models.user import Role
    import app.models  # noqa: F401 - register all models

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed required roles
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
    """Provide an async test client for API requests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


# ─── Registration Tests ───────────────────────────────────────────────────────

class TestRegistration:

    async def test_register_user_success(self, async_client: AsyncClient):
        """Registering a new user returns 201 and the user profile."""
        payload = {
            "email": "alice@example.com",
            "full_name": "Alice Smith",
            "password": "securepass123",
            "role_name": "User",
        }
        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["full_name"] == "Alice Smith"
        assert "id" in data
        assert "hashed_password" not in data  # Must never leak

    async def test_register_duplicate_email_fails(self, async_client: AsyncClient):
        """Registering with an existing email returns 422."""
        payload = {
            "email": "duplicate@example.com",
            "full_name": "Bob Jones",
            "password": "password123",
        }
        await async_client.post("/api/v1/auth/register", json=payload)
        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    async def test_register_short_password_fails(self, async_client: AsyncClient):
        """A password shorter than 6 characters is rejected."""
        payload = {
            "email": "weak@example.com",
            "full_name": "Weak Password",
            "password": "12",
        }
        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    async def test_register_invalid_email_fails(self, async_client: AsyncClient):
        """An invalid email format is rejected by Pydantic validation."""
        payload = {
            "email": "not-an-email",
            "full_name": "Bad Email",
            "password": "password123",
        }
        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422


# ─── Login Tests ──────────────────────────────────────────────────────────────

class TestLogin:

    @pytest.fixture(autouse=True)
    async def register_user(self, async_client: AsyncClient):
        """Register a test user before login tests."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "logintest@example.com",
                "full_name": "Login Tester",
                "password": "mypassword99",
            },
        )

    async def test_login_success(self, async_client: AsyncClient):
        """Valid credentials return access_token and refresh_token."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "logintest@example.com", "password": "mypassword99"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password_fails(self, async_client: AsyncClient):
        """Wrong password returns 401."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "logintest@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    async def test_login_unknown_email_fails(self, async_client: AsyncClient):
        """Unknown email returns 401."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "password"},
        )
        assert response.status_code == 401


# ─── User Profile Tests ───────────────────────────────────────────────────────

class TestUserProfile:

    @pytest.fixture(autouse=True)
    async def register_and_login(self, async_client: AsyncClient):
        """Register and login a test user, store tokens."""
        await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "profiletest@example.com",
                "full_name": "Profile Tester",
                "password": "profilepass1",
            },
        )
        login = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "profiletest@example.com", "password": "profilepass1"},
        )
        tokens = login.json()
        self.access_token = tokens["access_token"]
        self.refresh_token = tokens["refresh_token"]

    async def test_get_profile_success(self, async_client: AsyncClient):
        """Authenticated user can fetch their own profile."""
        response = await async_client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {self.access_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profiletest@example.com"

    async def test_get_profile_unauthenticated_fails(self, async_client: AsyncClient):
        """Accessing profile without a token returns 401."""
        response = await async_client.get("/api/v1/users/me")
        assert response.status_code == 401

    async def test_update_profile_success(self, async_client: AsyncClient):
        """Authenticated user can update their profile."""
        response = await async_client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={"mental_wellness_goal": "Reduce stress and sleep better"},
        )
        assert response.status_code == 200
        assert response.json()["mental_wellness_goal"] == "Reduce stress and sleep better"

    async def test_refresh_token_success(self, async_client: AsyncClient):
        """A valid refresh token returns a new token pair."""
        response = await async_client.post(
            f"/api/v1/auth/refresh?refresh_token={self.refresh_token}",
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    async def test_invalid_token_fails(self, async_client: AsyncClient):
        """A tampered or invalid token returns 401."""
        response = await async_client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalidtokenhere"},
        )
        assert response.status_code == 401


# ─── Health Check ─────────────────────────────────────────────────────────────

class TestHealthCheck:

    async def test_health_endpoint(self, async_client: AsyncClient):
        """Health check endpoint returns status: healthy."""
        response = await async_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
