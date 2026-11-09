"""
Emora Backend - Language Detection Tests (Step 2)

Tests for the language detection agent:
  - English message → target_language = 'en'
  - Amharic message → target_language = 'am'
  - Explicit English switch ("i need in inglish") → 'en', locked
  - Explicit Amharic switch ("በአማርኛ") → 'am', locked
  - Misspelled switch request → still detected
  - Locked language is preserved on next neutral message
"""

import pytest

from app.agents.language import detect_language, language_node


# ─── Unit tests for detect_language() ────────────────────────────────────────

class TestDetectLanguage:

    def test_english_message_returns_en(self):
        """Standard English sentence → target 'en'."""
        lang, locked = detect_language("I feel anxious today and can't sleep.")
        assert lang == "en"
        assert locked is False

    def test_amharic_message_returns_am(self):
        """Message written in Ethiopic script → target 'am'."""
        lang, locked = detect_language("ዛሬ በጣም ደከምኩ፣ ምን ማድረግ እችላለሁ?")
        assert lang == "am"
        assert locked is False

    def test_explicit_english_switch(self):
        """'English please' → 'en' and locked=True."""
        lang, locked = detect_language("English please", current_language="am")
        assert lang == "en"
        assert locked is True

    def test_explicit_english_switch_misspelled(self):
        """Misspelling 'inglish' → still switches to English."""
        lang, locked = detect_language("i need in inglish", current_language="am")
        assert lang == "en"
        assert locked is True

    def test_explicit_amharic_switch(self):
        """Amharic script switch phrase → 'am' and locked=True."""
        lang, locked = detect_language("በአማርኛ ተናገር", current_language="en")
        assert lang == "am"
        assert locked is True

    def test_explicit_amharic_keyword(self):
        """The word 'amharic' → switches to 'am'."""
        lang, locked = detect_language("Can you reply in amharic?", current_language="en")
        assert lang == "am"
        assert locked is True

    def test_locked_language_preserved_on_neutral_message(self):
        """Once locked to 'en', a neutral message keeps 'en'."""
        # First turn: explicit switch
        lang, locked = detect_language("i need in inglish", current_language="am")
        # Second turn: neutral message — locked should hold
        lang2, locked2 = detect_language(
            "Thank you, I feel better now.", current_language=lang, language_locked=locked
        )
        assert lang2 == "en"
        assert locked2 is True

    def test_mixed_message_latin_dominant_returns_en(self):
        """Mostly Latin text with one Amharic word → 'en'."""
        lang, locked = detect_language("I am fine, አመሰግናለሁ for your help.")
        assert lang == "en"

    def test_amharic_dominant_mixed_returns_am(self):
        """Mostly Ethiopic script → 'am'."""
        lang, locked = detect_language("ደህና ነኝ፣ thank you !")
        assert lang == "am"


# ─── Async node test ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestLanguageNode:

    async def test_language_node_english_input(self):
        """Node sets target_language='en' for English input."""
        state = {
            "user_message": "Hello, I need help with stress.",
            "target_language": "en",
            "language_locked": False,
            "user_id": 1,
        }
        result = await language_node(state)
        assert result["target_language"] == "en"
        assert result["language_locked"] is False

    async def test_language_node_amharic_input(self):
        """Node sets target_language='am' for Amharic input."""
        state = {
            "user_message": "ሰላም፣ ዛሬ ብዙ ተጨናንቄያለሁ።",
            "target_language": "en",
            "language_locked": False,
            "user_id": 1,
        }
        result = await language_node(state)
        assert result["target_language"] == "am"

    async def test_language_node_switch_to_english(self):
        """Explicit switch phrase → locked=True, target='en'."""
        state = {
            "user_message": "please switch to english",
            "target_language": "am",
            "language_locked": False,
            "user_id": 1,
        }
        result = await language_node(state)
        assert result["target_language"] == "en"
        assert result["language_locked"] is True

    async def test_language_node_preserves_other_state_fields(self):
        """Node must return all original state fields (no data loss)."""
        state = {
            "user_message": "I'm feeling okay.",
            "target_language": "en",
            "language_locked": False,
            "user_id": 42,
            "conversation_id": 7,
            "intent": "general_question",
            "is_crisis": False,
        }
        result = await language_node(state)
        assert result["user_id"] == 42
        assert result["conversation_id"] == 7
        assert result["intent"] == "general_question"
        assert result["is_crisis"] is False
