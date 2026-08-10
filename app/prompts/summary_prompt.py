"""
Emora Backend - Summary Prompt

Prompt template used to instruct the LLM to generate a concise summary
of a conversation. Stored separately from business logic.
"""

SUMMARY_PROMPT_TEMPLATE = """You are a compassionate mental health support AI assistant.

Please generate a concise, empathetic summary of the following conversation between a user and Emora, the mental wellness companion.

The summary should:
1. Be 2-4 sentences long.
2. Capture the main emotional themes and topics discussed.
3. Note any significant concerns raised (e.g., stress, anxiety, relationship issues).
4. Use third-person perspective and maintain user privacy (do not repeat personal details verbatim).
5. Be written in a clinical yet compassionate tone.

Conversation History:
{conversation_history}

Please provide only the summary text, with no preamble or labels.
"""


def get_summary_prompt(conversation_history: str) -> str:
    """
    Format and return the conversation summary prompt.

    Args:
        conversation_history: A formatted string of the conversation messages.

    Returns:
        The fully formatted summary prompt.
    """
    return SUMMARY_PROMPT_TEMPLATE.format(conversation_history=conversation_history)


def format_messages_for_summary(messages: list) -> str:
    """
    Format a list of message dicts/objects into a readable conversation string.

    Args:
        messages: List of Message objects or dicts with 'role' and 'content'.

    Returns:
        Formatted conversation string.
    """
    lines = []
    for msg in messages:
        if hasattr(msg, "role"):
            role = msg.role.capitalize()
            content = msg.content
        else:
            role = msg.get("role", "Unknown").capitalize()
            content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)
