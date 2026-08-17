"""
Emora Backend - Mood Tracking Module Tests

Tests for:
  - Logging mood score (valid & invalid ranges)
  - Fetching mood history (weekly, monthly, all)
  - Trend calculations (average score, emotion frequency count, daily averages)
  - Log deletion and authorization controls
"""

from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.connection import get_db_session
from app.main import app
from app.models.mood import MoodLog

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


@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
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

class TestLogMood:

    async def test_log_mood_success(self, async_client: AsyncClient):
        """Logging valid mood score (1-10) works and saves data correctly."""
        token = await register_and_login(async_client, "mood1@test.com")
        payload = {
            "score": 8,
            "mood_notes": "Felt good and productive today.",
            "emotions": ["happy", "motivated"],
        }
        response = await async_client.post(
            "/api/v1/mood", json=payload, headers=auth_headers(token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["score"] == 8
        assert data["mood_notes"] == "Felt good and productive today."
        assert data["emotions"] == ["happy", "motivated"]
        assert "id" in data

    async def test_log_mood_out_of_bounds_score_fails(self, async_client: AsyncClient):
        """Scores outside 1-10 are rejected with 422."""
        token = await register_and_login(async_client, "mood2@test.com")

        # Too high
        response1 = await async_client.post(
            "/api/v1/mood", json={"score": 11}, headers=auth_headers(token)
        )
        assert response1.status_code == 422

        # Too low
        response2 = await async_client.post(
            "/api/v1/mood", json={"score": 0}, headers=auth_headers(token)
        )
        assert response2.status_code == 422

    async def test_log_mood_unauthenticated(self, async_client: AsyncClient):
        """Unauthenticated requests are blocked with 401."""
        response = await async_client.post("/api/v1/mood", json={"score": 5})
        assert response.status_code == 401


class TestMoodHistoryAndTrends:

    @pytest.fixture()
    async def seed_mood_data(self):
        """Helper fixture to seed mood logs with varying timestamps."""
        async with TestSessionLocal() as session:
            # We will manually construct MoodLog instances for user_id = 3
            # We seed:
            # Log 1: today, score=8, emotions=["happy", "calm"]
            # Log 2: yesterday, score=6, emotions=["anxious", "calm"]
            # Log 3: 15 days ago, score=5, emotions=["sad"]
            # Log 4: 45 days ago, score=9 (should not appear in weekly/monthly)
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            log1 = MoodLog(user_id=3, score=8, mood_notes="Today", emotions=["happy", "calm"], created_at=now)
            log2 = MoodLog(user_id=3, score=6, mood_notes="Yesterday", emotions=["anxious", "calm"], created_at=now - timedelta(days=1))
            log3 = MoodLog(user_id=3, score=5, mood_notes="Two weeks ago", emotions=["sad"], created_at=now - timedelta(days=15))
            log4 = MoodLog(user_id=3, score=9, mood_notes="Long ago", emotions=["happy"], created_at=now - timedelta(days=45))

            session.add_all([log1, log2, log3, log4])
            await session.commit()

    async def test_mood_history_filtering(self, async_client: AsyncClient, seed_mood_data):
        """Mood history query filters correctly by period ('weekly', 'monthly', 'all')."""
        # Register user (gets ID 3 in this clean sequence)
        token = await register_and_login(async_client, "history@test.com")

        # 1 — Weekly history (should return Log 1, Log 2)
        resp_week = await async_client.get("/api/v1/mood/history?period=weekly", headers=auth_headers(token))
        assert resp_week.status_code == 200
        data_week = resp_week.json()
        assert len(data_week) == 2
        assert data_week[0]["mood_notes"] == "Today"
        assert data_week[1]["mood_notes"] == "Yesterday"

        # 2 — Monthly history (should return Log 1, Log 2, Log 3)
        resp_month = await async_client.get("/api/v1/mood/history?period=monthly", headers=auth_headers(token))
        assert resp_month.status_code == 200
        data_month = resp_month.json()
        assert len(data_month) == 3

        # 3 — All history (should return all 4 logs)
        resp_all = await async_client.get("/api/v1/mood/history?period=all", headers=auth_headers(token))
        assert resp_all.status_code == 200
        data_all = resp_all.json()
        assert len(data_all) == 4

    async def test_mood_trends_aggregations(self, async_client: AsyncClient, seed_mood_data):
        """Trends endpoint aggregates correctly (weekly period)."""
        token = await register_and_login(async_client, "trends@test.com")
        # Registered user gets ID 4. To test trends, we need to log some items for this user.
        # Log 1: score=8, emotions=["happy", "calm"]
        await async_client.post("/api/v1/mood", json={"score": 8, "emotions": ["happy", "calm"]}, headers=auth_headers(token))
        # Log 2: score=6, emotions=["anxious", "calm"]
        await async_client.post("/api/v1/mood", json={"score": 6, "emotions": ["anxious", "calm"]}, headers=auth_headers(token))

        response = await async_client.get("/api/v1/mood/trends?period=weekly", headers=auth_headers(token))
        assert response.status_code == 200
        data = response.json()

        # Check averages
        assert data["period"] == "weekly"
        assert data["summary"]["average_score"] == 7.0
        assert data["summary"]["total_logs"] == 2

        # Check emotion frequencies
        freqs = data["summary"]["emotion_frequencies"]
        assert freqs["calm"] == 2
        assert freqs["happy"] == 1
        assert freqs["anxious"] == 1

        # Check daily averages grouping
        assert len(data["daily_averages"]) == 1
        assert data["daily_averages"][0]["average_score"] == 7.0
        assert data["daily_averages"][0]["count"] == 2


class TestDeleteMoodLog:

    async def test_delete_mood_log_success(self, async_client: AsyncClient):
        """User can delete their own mood log."""
        token = await register_and_login(async_client, "deleteown@test.com")
        log_res = await async_client.post(
            "/api/v1/mood", json={"score": 7, "mood_notes": "Will delete"}, headers=auth_headers(token)
        )
        log_id = log_res.json()["id"]

        del_res = await async_client.delete(f"/api/v1/mood/{log_id}", headers=auth_headers(token))
        assert del_res.status_code == 204

        # Verify it's gone
        history_res = await async_client.get("/api/v1/mood/history", headers=auth_headers(token))
        assert not any(log["id"] == log_id for log in history_res.json())

    async def test_delete_other_user_log_forbidden(self, async_client: AsyncClient):
        """Deleting a different user's log is forbidden (403)."""
        token_a = await register_and_login(async_client, "user_a@test.com")
        token_b = await register_and_login(async_client, "user_b@test.com")

        # User A logs mood
        log_res = await async_client.post(
            "/api/v1/mood", json={"score": 7}, headers=auth_headers(token_a)
        )
        log_id = log_res.json()["id"]

        # User B tries to delete User A's log
        del_res = await async_client.delete(f"/api/v1/mood/{log_id}", headers=auth_headers(token_b))
        assert del_res.status_code == 403

    async def test_delete_nonexistent_log_returns_404(self, async_client: AsyncClient):
        """Attempting to delete a non-existent log returns 404."""
        token = await register_and_login(async_client, "delete404@test.com")
        del_res = await async_client.delete("/api/v1/mood/999999", headers=auth_headers(token))
        assert del_res.status_code == 404
