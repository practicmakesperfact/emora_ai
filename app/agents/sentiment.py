"""
Sentiment Analysis Agent
Detects the primary emotion from the user's message and logs it to the DB.
"""

import json
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.logging import get_logger
from app.models.sentiment import SentimentLog

logger = get_logger(__name__)

SENTIMENT_SYSTEM_PROMPT = """Detect the primary emotion in the user's message.
Choose ONE label from: Happiness, Sadness, Anxiety, Stress, Anger, Fear, Burnout, Loneliness, Neutral.
Also provide a confidence score between 0.0 and 1.0.

Respond ONLY with a valid JSON object:
{"sentiment": "<label>", "confidence": <0.0-1.0>}
"""


async def sentiment_node(state: dict, db: AsyncSession) -> dict:
    """
    Detects sentiment and logs it to the database.
    Sets: sentiment, sentiment_confidence
    """
    groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    try:
        response = await groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SENTIMENT_SYSTEM_PROMPT},
                {"role": "user", "content": state["user_message"]},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=64,
        )
        raw = response.choices[0].message.content or "{}"
        result = json.loads(raw)
    except Exception as e:
        logger.error("Sentiment agent failed", error=str(e))
        result = {"sentiment": "Neutral", "confidence": 0.5}

    sentiment = result.get("sentiment", "Neutral")
    confidence = float(result.get("confidence", 0.5))

    # Log to database asynchronously
    try:
        log = SentimentLog(
            user_id=state["user_id"],
            conversation_id=state["conversation_id"],
            sentiment=sentiment,
            confidence_score=confidence,
        )
        db.add(log)
        await db.flush()
    except Exception as e:
        logger.error("Failed to log sentiment to DB", error=str(e))

    logger.debug("Sentiment detected", sentiment=sentiment, confidence=confidence)
    return {**state, "sentiment": sentiment, "sentiment_confidence": confidence}
