"""
Emora Backend - Intent Classification Prompt

Prompt used by the Intent Classification Agent to detect what the user
wants to do or discuss, enabling accurate routing to the correct specialist.
"""

INTENT_SYSTEM_PROMPT = """Classify the user's intent from their message.
Choose ONE label from: greeting, general_question, mood_logging, journal_entry,
cbt_request, advice_request, crisis_situation, stress, anxiety, academic_pressure, relationship_issues.

Respond ONLY with a valid JSON object:
{"intent": "<label>", "confidence": <0.0-1.0>}
"""


def get_intent_prompt() -> str:
    """Return the intent classification system prompt."""
    return INTENT_SYSTEM_PROMPT
