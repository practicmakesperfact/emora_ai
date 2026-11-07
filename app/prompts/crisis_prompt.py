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

CRISIS_RESPONSE_HIGH = """በጣም ከባድ ጊዜ ውስጥ እያለፍክ/ሽ እንደሆነ ይሰማኛል፣ እና ይህንን ያካፈልከኝ/ሽኝ በጣም ደስ ብሎኛል።
ስሜትህ/ሽ እውነተኛ እና ትክክለኛ ነው።

I can hear that you're going through an incredibly difficult time right now,
and I'm really glad you reached out. Your feelings are real and valid.

ብቻህን/ሽ እንዳልሆንክ/ሽ እወቅ/ቂ። አሁን ማድረግ ያለብህ/ሽ ዋናው ነገር እርዳታ ሊሰጥ ከሚችል ሰው ጋር መገናኘት ነው:

Please know that you are not alone. Right now, the most important thing is to connect with someone
who can truly help:

🆘 **የአደጋ ጊዜ አገልግሎት / Emergency**: 939 (ፖሊስ / Police) | 907 (አምቡላንስ / Ambulance)
📞 **የአእምሮ ጤና የስልክ መስመር / Mental Health Helpline**: 8335 (ነፃ፣ 24/7 / Free, 24/7)
🏥 **አማኑኤል የአእምሮ ጤና ስፔሻላይዝድ ሆስፒታል / Amanuel Mental Specialized Hospital** — Addis Ababa
🏥 **ጥቁር አንበሳ ስፔሻላይዝድ ሆስፒታል / Tikur Anbessa (Black Lion) Hospital** — Addis Ababa
🏥 **ቅዱስ ጳውሎስ ሆስፒታል / St. Paul's Hospital Millennium Medical College** — Addis Ababa

እባክህ/ሽ አሁኑኑ ለምትተማመንበት/ቢው ሰው ወይም ከላይ ለተዘረዘሩት አገልግሎቶች ደውል/ደውዪ።
ለደህንነትህ/ሽ እና ለጤንነትህ/ሽ ያስባል።

Please reach out to a trusted friend, family member, or one of these services right now.
I care about your safety and wellbeing.
"""

def get_crisis_detection_prompt(message: str) -> str:
    """Return the user prompt for crisis risk classification."""
    return f"Assess the risk level in this message:\n\n{message}"
