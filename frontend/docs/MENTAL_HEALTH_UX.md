# Mental Health UX Principles

Emora is designed differently from standard productivity chatbots (like ChatGPT) because mental health conversations require a higher degree of emotional intelligence, safety, and care in the UI.

## Color Psychology
- **Primary**: Calming Indigos and Purples. Avoid stark, high-anxiety colors like bright red or neon green for general UI.
- **Crisis Warnings**: Soft ambers and muted roses. We want to alert the user without triggering panic.

## Emotional Safety
- **No Deletion Anxiety**: Users should feel in control of their data. Deleting conversations, journal entries, and mood logs is prominent and requires minimal clicks, but includes a soft confirmation to prevent accidental loss.
- **Privacy First**: The chat input permanently displays a privacy reminder (`PRIVACY_NOTICE`) advising users not to share PII (Personally Identifiable Information).
- **Non-Judgmental Empty States**: Empty states (like having no journal entries) use encouraging, gentle copy rather than robotic "No Data Found" messages.

## Crisis Alerts Component
The `CrisisAlert.tsx` component is dynamically triggered by the backend AI sentiment/intent analysis.
- **Low/Medium**: Soft prompts encouraging self-care or providing links to support resources.
- **High/Critical**: Urgent but calm UI blocks providing immediate emergency hotlines and direct access to human counselors.

## Language and Tone
The UI copy uses empathetic, supportive language. Instead of "Submit Data", we use "Save Entry". Instead of "Errors", we frame them as "Glitches" or "Connectivity issues" to avoid blaming the user.
