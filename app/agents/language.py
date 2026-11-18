"""
Emora Backend - Language Detection Agent

Detects the target reply language from each user message:
  1. Explicit switch requests  ("English please", "i need in inglish", "በአማርኛ")
     → override and lock to requested language
  2. Script detection (Amharic Ethiopic Unicode block U+1200-U+137F)
     → reply in the detected script's language
  3. Fallback to the user's profile preferred_language stored in state,
     or 'en' if unknown.

This node is fast and pure (no LLM call needed).
Sets: target_language ('en' | 'am'), language_locked (bool)
"""

import re
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── Amharic Ethiopic script range (U+1200–U+137F) ───────────────────────────
_ETHIOPIC_RE = re.compile(r"[\u1200-\u137F]")

# ── Explicit language-switch phrases ─────────────────────────────────────────
# Covers common misspellings and Amharic phrasing ("በአማርኛ ተናገር", "in english please")
_SWITCH_TO_EN = re.compile(
    r"\b(english|inglish|inglis|ingilish|in english|switch to english|"
    r"speak english|reply in english|continue in english|"
    r"use english|want english)\b",
    re.IGNORECASE,
)
_SWITCH_TO_AM = re.compile(
    r"(በአማርኛ|አማርኛ|amharic|in amharic|switch to amharic|"
    r"speak amharic|reply in amharic|continue in amharic)",
    re.IGNORECASE,
)


def detect_language(
    user_message: str,
    current_language: str = "en",
    language_locked: bool = False,
) -> tuple[str, bool]:
    """
    Detect the target reply language for a user message.

    Args:
        user_message:     The raw user text.
        current_language: The language used in the previous turn ('en' | 'am').
        language_locked:  If True, an explicit switch has already been requested;
                          only another explicit switch overrides it.

    Returns:
        (target_language, language_locked)
        target_language: 'en' or 'am'
        language_locked: True if the user gave an explicit switch command
    """
    msg = user_message.strip()

    # 1 — Explicit switch request wins over everything
    if _SWITCH_TO_EN.search(msg):
        logger.debug("Explicit EN switch detected", message=msg[:60])
        return "en", True

    if _SWITCH_TO_AM.search(msg):
        logger.debug("Explicit AM switch detected", message=msg[:60])
        return "am", True

    # 2 — If a previous explicit switch is locked in, keep it
    if language_locked:
        return current_language, True

    # 3 — Script-based detection
    ethiopic_chars = len(_ETHIOPIC_RE.findall(msg))
    total_alpha = max(1, len(re.findall(r"[a-zA-Z\u1200-\u137F]", msg)))
    ethiopic_ratio = ethiopic_chars / total_alpha

    if ethiopic_ratio >= 0.4:
        return "am", False

    # 4 — Fallback: keep current language
    return current_language, False


async def language_node(state: dict, db=None) -> dict:
    """
    LangGraph-compatible node. Reads state, runs detect_language, updates state.
    Sets: target_language, language_locked
    """
    user_message = state.get("user_message", "")
    current_language = state.get("target_language", state.get("preferred_language", "en"))
    language_locked = state.get("language_locked", False)

    target_language, language_locked = detect_language(
        user_message, current_language, language_locked
    )

    logger.debug(
        "Language detection complete",
        target_language=target_language,
        language_locked=language_locked,
        user_id=state.get("user_id"),
    )

    return {**state, "target_language": target_language, "language_locked": language_locked}
