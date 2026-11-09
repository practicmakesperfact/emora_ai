You are helping me improve the USER-facing side of "Emora", an AI mental health
support app (Next.js + Tailwind frontend, Python backend, Llama model with RAG).
Users are mostly Ethiopian university students, using English and Amharic,
mostly on phones.

Rules for every task I give you:
1. Do ONLY the task in the current message. Do not refactor or restyle unrelated files.
2. Before coding, list the files you will change.
3. Keep the existing visual style (colors, rounded cards, Inter font).
4. Make all user-facing text translatable (English + Amharic), no hardcoded strings.
5. After finishing, list what you changed and how I can test it manually.
6. If something is unclear, ask me one question instead of guessing.
Reply "Ready" and wait for my first task.
Step 1: Layout, sidebar toggle, and language switcher
TASK: Improve the app shell for logged-in users.

1. Add a top bar to the main layout containing: sidebar toggle button (left),
   language switcher (right), and a "Get help now" button (right, red-tinted).
2. Desktop: the toggle collapses the sidebar to an icon-only rail with tooltips
   and expands it again. Remember the state between visits.
3. Mobile (<768px): the sidebar is hidden by default and opens as a drawer from
   the hamburger button, with a dark overlay. Tapping the overlay or a link closes it.
4. Language switcher: a compact "EN | አማ" segmented toggle. Switching updates the
   UI language immediately, saves to the user's profile preferred_language, and
   keeps the Settings page in sync. Persist for guests via localStorage.
5. Load Noto Sans Ethiopic for Amharic text with larger line height.
6. The "Get help now" button must stay visible in both collapsed and mobile states
   and link to /support.

ACCEPTANCE: works at 360px, 768px, and 1440px widths; keyboard accessible
(Tab, Enter, Esc closes drawer); aria-labels on icon buttons.
Step 2: Fix language handling in the chat
TASK: Fix chat language behavior. Currently an English user with an English
profile got an Amharic first reply, and "i need in inglish" was ignored.

1. The first assistant message must use the user's preferred_language.
2. For each user message, detect the language (Amharic script vs Latin) and
   reply in the same language.
3. If the user explicitly asks to switch language (e.g. "English please",
   "i need in inglish", "በአማርኛ"), acknowledge it ("Of course, I'll continue in
   English.") and keep that language until they change it.
4. Pass the target language to the LLM in the system prompt on every request.
5. Add tests for: English message, Amharic message, explicit switch request,
   misspelled switch request.

Do not change the chat UI in this task.
Step 3: Crisis state in the chat
TASK: Build a proper crisis-state UI inside the chat.

When the backend returns a high-risk flag for a message:
1. Show a distinct, calm card in the conversation (soft warm background, not
   alarming red) with: a short validating message, tap-to-call buttons for the
   emergency numbers from the central config file, a "Talk to a counselor"
   button, and "I'm safe, continue chatting".
2. Number buttons must use tel: links.
3. Add a persistent "Get help now" button in the chat header (reuse from Step 1).
4. The card text must be in English and Amharic.
5. Never show crisis help only as a text link.

Create a mock/test mode so I can trigger the card without sending real
high-risk text.
Step 4: Verified emergency numbers (central config)
TASK: Centralize emergency contacts and fix the support page.

1. Create one config file (e.g. lib/emergencyContacts.ts) holding all numbers:
   name (EN + Amharic), number, description, availability, and a
   "lastVerified" date and "source" field.
2. Use this single file in the support page, crisis card, and sidebar help card.
3. Use these values, which I have verified myself: [PASTE YOUR VERIFIED NUMBERS HERE].
   Do NOT invent or change any numbers.
4. Add a short note on the support page: "Numbers last verified on <date>."
5. Add placeholders for local resources: Wollo University counseling office and
   Dessie hospital, marked TODO for me to fill in.

Before sending this one, call each number yourself. As far as I know, Ethiopia’s police line is 991 and fire is 939, but your page lists 939 as Police, so please confirm the correct values.

Step 5: Consent, transparency, and privacy text
TASK: Update transparency and privacy messaging.

1. In the "Before we begin" card add: "If you express a risk of serious harm,
   a trained counselor may review that part of the conversation to help keep
   you safe."
2. Add a first-time consent screen with two checkboxes (understand it is an AI
   not a therapist; understand the counselor-review rule) that must be accepted
   before the first chat. Store consent with a timestamp.
3. Replace the Settings "Privacy & Data" text with this accurate wording:
   [PASTE WHAT REALLY HAPPENS TO DATA: where the model runs, what is stored].
4. Fix the truncated privacy banner above the chat input: shorten it to one
   line with a "Learn more" expander.
5. Make the banner and card text translatable.
Step 6: Profile form validation
TASK: Clean up the Profile page.

1. Remove the "string" value in Emergency Contact. Split into: contact name,
   relationship, phone number (validate Ethiopian formats: +251 9XXXXXXXX,
   09XXXXXXXX, 07XXXXXXXX).
2. Add real placeholders ("e.g. Sister, +251 9...").
3. Time zone: replace free text with a dropdown, default Africa/Addis_Ababa.
4. Password: separate "Change password" into its own section requiring current
   password, with autocomplete="new-password" and show/hide toggle. It must
   never be pre-filled.
5. Remove Language/Time Zone duplication: keep Language in the top-bar switcher
   and Settings only.
6. Inline validation messages, a clear Save button, and a success toast.
Step 7: Conversations list
TASK: Improve conversation management.

1. Do NOT create a conversation in the database when "New Chat" is clicked.
   Create it only when the first message is sent.
2. Auto-generate the title from the first user message (max 40 characters) or a
   short LLM summary. Replace "New Conversation / No summary yet".
3. Show the title in the chat header instead of "Conversation #13".
4. Add delete (with confirmation) and rename for each conversation.
5. Add an empty state when there are no conversations.
6. Delete my existing empty "New Conversation" records with a one-time migration
   script.
Step 8: Chat screen polish
TASK: Polish the chat screen only.

1. Limit message bubble width to about 70% (max ~680px).
2. Replace "47 left" with "47 messages left today"; show a soft warning at 5 left.
3. Add quick-start chips in the empty state: "I feel anxious", "I can't sleep",
   "Help me breathe", "I just need to vent". Clicking one sends it as a message.
4. Show a typing indicator while the AI responds.
5. Show a small "Source" label under replies that used RAG citations.
6. Make Amharic text 1rem+ with line-height 1.7.
Step 9: Dashboard and wellbeing features
TASK: Improve the user dashboard.

1. Show today's mood (or a "Log your mood" prompt), a streak counter, and a
   suggested exercise.
2. Replace the list of identical "New Conversation" items with titled
   conversations (from Step 7).
3. Add one guided exercise page: a breathing exercise (4-4-6) with an animated
   circle that respects the "Reduce Motion" setting.
4. Mood tracker: use faces/soft colors, avoid red/green judgment, and phrase
   insights gently ("Your mood has been lower this week").
Step 10: Accessibility and contrast
TASK: Accessibility pass.

1. Make all text meet WCAG AA contrast (4.5:1), especially timestamps, hint text,
   and the disabled Send button.
2. Add visible focus outlines, aria-labels for icon-only buttons, and
   aria-live for new chat messages.
3. Ensure touch targets are at least 44x44px.
4. Respect prefers-reduced-motion and the Reduce Motion setting everywhere.
Report each issue you fixed.
Step 11: Data rights
TASK: Add privacy controls to Settings.

1. "Export my data": download conversations, mood logs, and journal entries as JSON.
2. "Delete my account and all data": confirmation dialog requiring typing DELETE,
   then remove all user data and sign out.
3. Add a short explanation of what is deleted and what is kept (if anything).