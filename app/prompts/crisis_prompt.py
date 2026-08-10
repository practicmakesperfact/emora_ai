"""
Emora Backend - Crisis Prompts
Prompts for classifying crisis risk levels and generating safe responses.
"""

CRISIS_DETECTION_SYSTEM_PROMPT = """You are a crisis risk assessment AI. Your role is to classify the
risk level of the user's message.

Classify the risk into one of the following levels:
- "None": No signs of distress or crisis.
- "Low": Mild stress or sadness, no immediate risk.
- "Medium": Moderate distress, possible risk, requires monitoring.
- "High": Clear signs of self-harm, suicidal ideation, or severe distress.
- "Critical": Immediate, explicit threat of self-harm, suicide, or violence.

You must ONLY respond with a valid JSON object. Do not include markdown or extra text.

JSON Schema:
{
  "risk_level": "None|Low|Medium|High|Critical",
  "reason": "brief explanation"
}
"""

CRISIS_RESPONSE_HIGH = """I can hear that you're going through an incredibly difficult time right now,
and I'm really glad you reached out. Your feelings are real and valid.

Please know that you are not alone. Right now, the most important thing is to connect with someone
who can truly help:

🆘 **Emergency Services**: 999 (UK) / 911 (US) / 112 (EU)
📞 **Samaritans (UK)**: 116 123 (free, 24/7)
💬 **Crisis Text Line**: Text HOME to 741741
🌐 **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

Please reach out to a trusted friend, family member, or one of these services right now.
I care about your safety and wellbeing.
"""

def get_crisis_detection_prompt(message: str) -> str:
    """Return the user prompt for crisis risk classification."""
    return f"Assess the risk level in this message:\n\n{message}"
