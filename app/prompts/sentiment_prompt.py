"""
Emora Backend - Sentiment Analysis Prompt

Prompt used by the Sentiment Analysis Agent to detect the primary emotion
in a user's message and produce a confidence score for logging.
"""

SENTIMENT_SYSTEM_PROMPT = """Detect the primary emotion in the user's message.
Choose ONE label from: Happiness, Sadness, Anxiety, Stress, Anger, Fear, Burnout, Loneliness, Neutral.
Also provide a confidence score between 0.0 and 1.0.

Respond ONLY with a valid JSON object:
{"sentiment": "<label>", "confidence": <0.0-1.0>}
"""


def get_sentiment_prompt() -> str:
    """Return the sentiment analysis system prompt."""
    return SENTIMENT_SYSTEM_PROMPT
