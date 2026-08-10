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

    # Add nodes
    graph.add_node("guardrail", lambda state: guardrail_node(state, db))
    graph.add_node("intent", lambda state: intent_node(state, db))
    graph.add_node("sentiment", lambda state: sentiment_node(state, db))
    graph.add_node("crisis", lambda state: crisis_node(state, db))
    graph.add_node("memory", lambda state: memory_node(state, db))
    graph.add_node("rag_retrieval", lambda state: rag_retrieval_node(state))
    graph.add_node("router", lambda state: router_node(state))
    graph.add_node("cbt", lambda state: cbt_node(state, db))
    graph.add_node("journaling", lambda state: journaling_node(state, db))
    graph.add_node("mood_tracking", lambda state: mood_tracking_node(state, db))
    graph.add_node("conversation", lambda state: conversation_node(state, db))
    graph.add_node("response_validation", lambda state: response_validation_node(state, db))
    graph.add_node("response_generator", lambda state: response_generator_node(state))

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
