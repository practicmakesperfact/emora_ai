"""
Emora Backend - LangGraph Agent Workflow
Defines the shared AgentState TypedDict and compiles the full agent graph.
"""

from typing import TypedDict, List, Optional, Annotated
import operator

from langgraph.graph import StateGraph, END


class AgentState(TypedDict):
    """Shared state passed between all agents in the workflow."""
    user_id: int
    conversation_id: int
    user_message: str

    # Safety
    is_safe: bool
    violation_type: str

    # Intent & Sentiment
    intent: str
    sentiment: str
    sentiment_confidence: float

    # Crisis
    risk_level: str
    is_crisis: bool
    crisis_response: Optional[str]

    # Memory & RAG
    memory_context: str
    rag_context: str

    # Final output
    final_response: str
    response_tokens: Annotated[List[str], operator.add]


def build_workflow(db) -> StateGraph:
    """
    Build and compile the LangGraph agent workflow.

    The pipeline is:
    1. Guardrail   → block unsafe input early
    2. Intent      → classify what the user wants
    3. Sentiment   → detect emotion for logging
    4. Crisis      → check for self-harm / distress risk
    5. Memory      → fetch conversation context
    6. RAG         → retrieve relevant knowledge chunks
    7. Router      → direct to specialist (CBT / Journal / Mood / Conversation)
    8. Validator   → ensure response is safe (no medical advice, hallucinations)
    9. Generator   → format final streaming output
    """
    from app.agents.guardrail import guardrail_node
    from app.agents.intent import intent_node
    from app.agents.sentiment import sentiment_node
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

    def route_after_guardrail(state: AgentState) -> str:
        return "intent" if state["is_safe"] else "response_generator"

    def route_after_crisis(state: AgentState) -> str:
        return "response_generator" if state["is_crisis"] else "memory"

    def route_specialist(state: AgentState) -> str:
        intent = state.get("intent", "general")
        if "cbt" in intent or "cognitive" in intent:
            return "cbt"
        if "journal" in intent:
            return "journaling"
        if "mood" in intent:
            return "mood_tracking"
        return "conversation"

    graph = StateGraph(AgentState)

    # Async node wrappers
    async def run_guardrail(state):
        return await guardrail_node(state, db)

    async def run_intent(state):
        return await intent_node(state, db)

    async def run_sentiment(state):
        return await sentiment_node(state, db)

    async def run_crisis(state):
        return await crisis_node(state, db)

    async def run_memory(state):
        return await memory_node(state, db)

    async def run_rag_retrieval(state):
        return await rag_retrieval_node(state)

    async def run_router(state):
        return await router_node(state)

    async def run_cbt(state):
        return await cbt_node(state, db)

    async def run_journaling(state):
        return await journaling_node(state, db)

    async def run_mood_tracking(state):
        return await mood_tracking_node(state, db)

    async def run_conversation(state):
        return await conversation_node(state, db)

    async def run_response_validation(state):
        return await response_validation_node(state, db)

    async def run_response_generator(state):
        return await response_generator_node(state)

    # Add nodes
    graph.add_node("guardrail", run_guardrail)
    graph.add_node("intent", run_intent)
    graph.add_node("sentiment", run_sentiment)
    graph.add_node("crisis", run_crisis)
    graph.add_node("memory", run_memory)
    graph.add_node("rag_retrieval", run_rag_retrieval)
    graph.add_node("router", run_router)
    graph.add_node("cbt", run_cbt)
    graph.add_node("journaling", run_journaling)
    graph.add_node("mood_tracking", run_mood_tracking)
    graph.add_node("conversation", run_conversation)
    graph.add_node("response_validation", run_response_validation)
    graph.add_node("response_generator", run_response_generator)

    # Set entry point
    graph.set_entry_point("guardrail")

    # Add edges
    graph.add_conditional_edges("guardrail", route_after_guardrail)
    graph.add_edge("intent", "sentiment")
    graph.add_edge("sentiment", "crisis")
    graph.add_conditional_edges("crisis", route_after_crisis)
    graph.add_edge("memory", "rag_retrieval")
    graph.add_edge("rag_retrieval", "router")
    graph.add_conditional_edges("router", route_specialist)
    graph.add_edge("cbt", "response_validation")
    graph.add_edge("journaling", "response_validation")
    graph.add_edge("mood_tracking", "response_validation")
    graph.add_edge("conversation", "response_validation")
    graph.add_edge("response_validation", "response_generator")
    graph.add_edge("response_generator", END)

    return graph.compile()
