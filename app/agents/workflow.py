"""
Emora Backend - Agent Workflow
Runs agents in parallel rounds to minimise LLM round-trip latency.

Execution plan (3 parallel LLM round-trips for a normal message):

  Round 1 (parallel): Guardrail + Intent + Sentiment
  Round 2 (serial):   Crisis  (needs sentiment for context)
  Round 3 (parallel): Memory + RAG Retrieval  (no LLM)
  Round 4 (serial):   Router -> Specialist (CBT / Journal / Mood / Conversation)
  Round 5 (serial):   Response Validation -> Response Generator

Early-exit paths:
  - Unsafe input  -> skip all after guardrail, return canned response
  - Crisis (High/Critical) -> skip specialist, return crisis response directly
"""

import asyncio
from typing import Optional


class AgentState(dict):
    """
    Shared mutable state dict passed between all agents.
    Typed as a plain dict so agents can simply return {**state, key: value}.
    """
    pass


async def run_workflow(
    db,
    user_id: int,
    conversation_id: int,
    user_message: str,
) -> str:
    """
    Execute the full agent pipeline and return the final response string.

    Agents that are independent of each other run concurrently via
    asyncio.gather, cutting wall-clock time from ~6-8 s to ~2-3 s.
    """
    from app.agents.guardrail import guardrail_node
    from app.agents.intent import intent_node
    from app.agents.sentiment import sentiment_node
    from app.agents.language import language_node
    from app.agents.crisis import crisis_node
    from app.agents.memory import memory_node
    from app.agents.rag_retrieval import rag_retrieval_node
    from app.agents.router import router_node
    from app.agents.cbt import cbt_node
    from app.agents.journaling import journaling_node
    from app.agents.mood_tracking import mood_tracking_node
    from app.agents.conversation import conversation_node
    from app.agents.response_validation import response_validation_node
    from app.agents.response_generator import response_generator_node

    # Initialise state
    state: AgentState = AgentState({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "user_message": user_message,
        "is_safe": True,
        "violation_type": "none",
        "intent": "general_question",
        "sentiment": "Neutral",
        "sentiment_confidence": 0.5,
        "risk_level": "None",
        "is_crisis": False,
        "crisis_response": None,
        "memory_context": "",
        "rag_context": "",
        "final_response": "",
        "response_tokens": [],
        # Language tracking — updated by language_node each turn
        "target_language": "en",   # 'en' | 'am'
        "language_locked": False,  # True after an explicit switch request
    })

    # -- Round 1: Guardrail + Intent + Sentiment + Language (parallel) ----------
    guardrail_result, intent_result, sentiment_result, language_result = await asyncio.gather(
        guardrail_node(state, db),
        intent_node(state, db),
        sentiment_node(state, db),
        language_node(state),
    )
    # Merge results — guardrail takes precedence for safety flags
    state.update(intent_result)
    state.update(sentiment_result)
    state.update(language_result)   # target_language, language_locked
    state.update(guardrail_result)

    # Early exit: unsafe input
    if not state["is_safe"]:
        return state.get(
            "final_response",
            "I'm sorry, I'm not able to process that kind of request. "
            "Please keep our conversation focused on mental health support.",
        )

    # -- Round 2: Crisis assessment (serial — needs full context) ---------------
    crisis_result = await crisis_node(state, db)
    state.update(crisis_result)

    # Early exit: crisis detected
    if state["is_crisis"]:
        return state.get("final_response") or state.get("crisis_response") or (
            "I'm concerned about what you've shared. Please reach out to emergency "
            "services (999/911/112) or text HOME to 741741 immediately."
        )

    # -- Round 3: Memory + RAG (parallel, no LLM calls) ------------------------
    memory_result, rag_result = await asyncio.gather(
        memory_node(state, db),
        rag_retrieval_node(state),
    )
    state.update(memory_result)
    state.update(rag_result)

    # -- Round 4: Router -> Specialist (one LLM call) --------------------------
    router_result = await router_node(state)
    state.update(router_result)

    intent = state.get("intent", "general_question")
    if "cbt" in intent or "cognitive" in intent:
        specialist_result = await cbt_node(state, db)
    elif "journal" in intent:
        specialist_result = await journaling_node(state, db)
    elif "mood" in intent:
        specialist_result = await mood_tracking_node(state, db)
    else:
        specialist_result = await conversation_node(state, db)
    state.update(specialist_result)

    # -- Round 5: Validation -> Generator --------------------------------------
    validation_result = await response_validation_node(state, db)
    state.update(validation_result)

    generator_result = await response_generator_node(state)
    state.update(generator_result)

    return state.get("final_response", "")


# -- Backwards-compatibility shim ----------------------------------------------
# chat_service.py calls build_workflow(db).ainvoke(state).
# This shim means no other file needs to change.

class _WorkflowShim:
    """Wraps run_workflow so it can be called as workflow.ainvoke(state)."""

    def __init__(self, db):
        self._db = db

    async def ainvoke(self, state: dict) -> dict:
        response = await run_workflow(
            db=self._db,
            user_id=state["user_id"],
            conversation_id=state["conversation_id"],
            user_message=state["user_message"],
        )
        return {**state, "final_response": response}


def build_workflow(db) -> "_WorkflowShim":
    """
    Returns a workflow object whose .ainvoke(state) runs the full parallel
    agent pipeline. Drop-in replacement for the old LangGraph StateGraph.
    """
    return _WorkflowShim(db)
