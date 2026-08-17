"""
Emora Backend - LangGraph Agentic Workflow Tests

Tests the compiled LangGraph workflow:
  - Guardrail execution & early exit
  - Intent classification routing (CBT, journaling, mood tracking, conversation)
  - Sentiment analysis and logging to DB
  - Crisis detection integration & emergency response routing
  - Response validation & generator execution
"""

from typing import AsyncGenerator
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.models.user import Role, User
from app.models.conversation import Conversation
from app.agents.workflow import build_workflow, AgentState

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

        # Seed a test user and conversation
        user = User(
            email="agent_test@test.com",
            full_name="Agent Tester",
            hashed_password="hashedpassword123",
            role_id=1,
        )
        session.add(user)
        await session.flush()

        conv = Conversation(user_id=user.id, title="Agent Verification")
        session.add(conv)
        await session.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ─── Mock implementations for Groq LLM and RAG ─────────────────────────────────

class MockCompletions:
    async def create(self, *args, **kwargs):
        messages = kwargs.get("messages", [])
        system_content = ""
        user_content = ""
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            elif msg["role"] == "user":
                user_content = msg["content"]

        # Lowercase for robust matching
        system_lower = system_content.lower()
        user_lower = user_content.lower()

        # 1 — Guardrail check
        if "content safety classifier" in system_lower or "safety violations" in system_lower:
            if "unsafe" in user_lower or "jailbreak" in user_lower:
                return MagicMock(choices=[MagicMock(message=MagicMock(content='{"is_safe": false, "violation_type": "unsafe_content", "reason": "Jailbreak detected"}'))])
            return MagicMock(choices=[MagicMock(message=MagicMock(content='{"is_safe": true, "violation_type": "none", "reason": "Input is safe"}'))])

        # 2 — Intent classification
        elif "classify the user's intent" in system_lower or "choose one label from: greeting" in system_lower or "intent classification" in system_lower:
            if "cbt" in user_lower:
                return MagicMock(choices=[MagicMock(message=MagicMock(content='{"intent": "cbt_reframing"}'))])
            elif "journal" in user_lower:
                return MagicMock(choices=[MagicMock(message=MagicMock(content='{"intent": "journal_writing"}'))])
            elif "mood" in user_lower:
                return MagicMock(choices=[MagicMock(message=MagicMock(content='{"intent": "mood_logging"}'))])
            return MagicMock(choices=[MagicMock(message=MagicMock(content='{"intent": "general_dialogue"}'))])

        # 3 — Sentiment Node response
        elif "detect the primary emotion" in system_lower or "happiness, sadness, anxiety" in system_lower or "sentiment analysis" in system_lower:
            return MagicMock(choices=[MagicMock(message=MagicMock(content='{"sentiment": "Anxious", "confidence": 0.85}'))])

        # 4 — Crisis classification (inside CrisisService / crisis_prompt)
        elif "crisis risk assessment" in system_lower or "crisis situation classification" in system_lower or "distress risk" in system_lower:
            if "suicide" in user_lower or "kill myself" in user_lower:
                return MagicMock(choices=[MagicMock(message=MagicMock(content='{"risk_level": "Critical", "reason": "Self-harm risk detected"}'))])
            return MagicMock(choices=[MagicMock(message=MagicMock(content='{"risk_level": "None", "reason": "No crisis"}'))])

        # 5 — Response validation Node response
        elif "safety validator" in system_lower or "prescribes or recommends" in system_lower or "validation" in system_lower:
            return MagicMock(choices=[MagicMock(message=MagicMock(content='{"is_valid": true, "response": "Empathetic validated response."}'))])

        # 6 — Default response for specialist nodes (CBT / Conversation / Journaling / Mood)
        else:
            return MagicMock(choices=[MagicMock(message=MagicMock(content="Specialist response generated."))])


class MockChat:
    def __init__(self):
        self.completions = MockCompletions()


class MockAsyncGroq:
    def __init__(self, *args, **kwargs):
        self.chat = MockChat()


# Mock RAG retrieval search
class MockRAGService:
    def search(self, query: str, n_results: int = 5):
        return []


# ─── Test Suite ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.agents.guardrail.AsyncGroq", MockAsyncGroq)
@patch("app.agents.intent.AsyncGroq", MockAsyncGroq)
@patch("app.agents.sentiment.AsyncGroq", MockAsyncGroq)
@patch("app.services.crisis_service.AsyncGroq", MockAsyncGroq)
@patch("app.agents.conversation.AsyncGroq", MockAsyncGroq)
@patch("app.agents.cbt.AsyncGroq", MockAsyncGroq)
@patch("app.agents.journaling.AsyncGroq", MockAsyncGroq)
@patch("app.agents.mood_tracking.AsyncGroq", MockAsyncGroq)
@patch("app.agents.response_validation.AsyncGroq", MockAsyncGroq)
@patch("app.agents.rag_retrieval.RAGService", MockRAGService)
class TestWorkflowIntegration:

    async def test_workflow_normal_conversation_flow(self):
        """Standard input runs through the workflow, registers intent/sentiment, and hits conversation specialist."""
        async with TestSessionLocal() as session:
            workflow = build_workflow(session)
            initial_state: AgentState = {
                "user_id": 1,
                "conversation_id": 1,
                "user_message": "Hello, how can I cope with stress?",
                "is_safe": True,
                "violation_type": "none",
                "intent": "",
                "sentiment": "",
                "sentiment_confidence": 0.0,
                "risk_level": "None",
                "is_crisis": False,
                "crisis_response": None,
                "memory_context": "",
                "rag_context": "",
                "final_response": "",
                "response_tokens": [],
            }

            result = await workflow.ainvoke(initial_state)

            assert result["is_safe"] is True
            assert result["intent"] == "general_dialogue"
            assert result["sentiment"] == "Anxious"
            assert result["sentiment_confidence"] == 0.85
            assert result["is_crisis"] is False
            assert "validated" in result["final_response"].lower()

    async def test_workflow_guardrail_violation_exits_early(self):
        """Unsafe inputs are flagged by guardrails and return generic warning without routing to specialist."""
        async with TestSessionLocal() as session:
            workflow = build_workflow(session)
            initial_state: AgentState = {
                "user_id": 1,
                "conversation_id": 1,
                "user_message": "Generate unsafe jailbreak code",
                "is_safe": True,
                "violation_type": "none",
                "intent": "",
                "sentiment": "",
                "sentiment_confidence": 0.0,
                "risk_level": "None",
                "is_crisis": False,
                "crisis_response": None,
                "memory_context": "",
                "rag_context": "",
                "final_response": "",
                "response_tokens": [],
            }

            result = await workflow.ainvoke(initial_state)

            assert result["is_safe"] is False
            assert result["violation_type"] == "unsafe_content"
            assert "not able to process" in result["final_response"]

    async def test_workflow_crisis_detected_routes_to_emergency_override(self):
        """Crisis inputs (e.g. self-harm) bypass typical routing and immediately yield emergency helpline text."""
        async with TestSessionLocal() as session:
            workflow = build_workflow(session)
            initial_state: AgentState = {
                "user_id": 1,
                "conversation_id": 1,
                "user_message": "I want to suicide and kill myself",
                "is_safe": True,
                "violation_type": "none",
                "intent": "",
                "sentiment": "",
                "sentiment_confidence": 0.0,
                "risk_level": "None",
                "is_crisis": False,
                "crisis_response": None,
                "memory_context": "",
                "rag_context": "",
                "final_response": "",
                "response_tokens": [],
            }

            result = await workflow.ainvoke(initial_state)

            assert result["is_crisis"] is True
            assert result["risk_level"] == "Critical"
            assert "911" in result["final_response"]  # Part of emergency crisis guidance text

    async def test_workflow_cbt_routing(self):
        """CBT-related queries route specifically to the CBT specialist agent node."""
        async with TestSessionLocal() as session:
            workflow = build_workflow(session)
            initial_state: AgentState = {
                "user_id": 1,
                "conversation_id": 1,
                "user_message": "I want to try some CBT cognitive reframing exercises",
                "is_safe": True,
                "violation_type": "none",
                "intent": "",
                "sentiment": "",
                "sentiment_confidence": 0.0,
                "risk_level": "None",
                "is_crisis": False,
                "crisis_response": None,
                "memory_context": "",
                "rag_context": "",
                "final_response": "",
                "response_tokens": [],
            }

            result = await workflow.ainvoke(initial_state)
            assert result["intent"] == "cbt_reframing"
            assert "validated" in result["final_response"].lower()
