# FRONTEND IMPLEMENTATION PROMPT

You are a Senior Frontend Engineer, Senior UI/UX Engineer, Accessibility Engineer, and Mental Health Product Designer.

Build a COMPLETE, FUNCTIONAL, CLEAN, MODULAR frontend for my:

# AI-DRIVEN AGENTIC MENTAL HEALTH SUPPORT CHATBOT

This frontend is the client application for an existing FastAPI backend.

This is a Final Year Project that will run ONLY on my local computer.

The frontend must use REAL backend APIs.

==========================================================
# CRITICAL REQUIREMENTS
==========================================================

DO NOT USE MOCK DATA.

DO NOT create:

- Mock users
- Mock conversations
- Fake AI responses
- Fake mood statistics
- Fake journal entries
- Fake crisis incidents
- Fake notifications
- Fake documents
- Fake analytics
- Hardcoded application data
- Simulated API responses
- Placeholder functionality

Every dynamic value must come from the real FastAPI backend.

If a backend endpoint is not implemented yet:

- Do NOT create fake data.
- Do NOT simulate the endpoint.
- Implement the proper API integration structure.
- Display an appropriate loading, empty, unavailable, or error state.

The frontend must be a REAL CLIENT of the FastAPI backend.

==========================================================
# TECHNOLOGY STACK
==========================================================

## Framework

Next.js

Use the current stable Next.js version with App Router.

## Language

TypeScript

## Styling

Tailwind CSS

## UI Components

Use a small, consistent component system.

Do not unnecessarily depend on multiple UI libraries.

## Server State

TanStack React Query

## HTTP Client

Axios

## Forms

React Hook Form

## Validation

Zod

## Icons

Lucide React

## Charts

Recharts

## Real-Time Communication

WebSocket API

## Authentication

JWT provided by FastAPI backend.

## Package Manager

Use npm.

==========================================================
# TECHNOLOGIES NOT TO USE
==========================================================

Do NOT use:

- React-only Vite frontend
- Firebase
- Supabase
- Clerk
- Auth0
- Mock Service Worker
- JSON Server
- Fake APIs
- Static JSON as application data
- Redux unless genuinely required
- Cloud deployment
- Separate authentication provider

FastAPI is the backend and single source of truth.

==========================================================
# BACKEND
==========================================================

Backend:

FastAPI

Base URL:

http://localhost:8000

Frontend environment variable:

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

The Groq API key MUST NEVER appear in the frontend.

The architecture must be:

Next.js
    ↓
FastAPI
    ↓
LangGraph
    ↓
Groq API
    ↓
Llama 3.1 8B

==========================================================
# PROJECT GOAL
==========================================================

Build a calm, safe, accessible, supportive user interface for an AI-driven mental health support chatbot.

The frontend must support:

- Empathetic AI conversations
- CBT-based guidance
- Mindfulness
- Grounding techniques
- Journaling
- Mood tracking
- Emotion information
- Crisis detection
- Crisis escalation
- RAG-based responses
- Source citations
- Conversation memory
- Counselor review
- Admin knowledge-base management

The chatbot is NOT a doctor or therapist.

The UI must clearly communicate:

"This chatbot is an AI-based mental health support assistant. It is not a licensed mental health professional and does not provide medical diagnosis or treatment."

==========================================================
# MENTAL HEALTH UX PRINCIPLES
==========================================================

This is NOT a generic chatbot UI.

Mental-health UX is a CORE REQUIREMENT.

The interface must feel:

- Calm
- Safe
- Supportive
- Private
- Respectful
- Non-judgmental
- Comfortable
- Simple
- Accessible
- Emotionally reassuring

Avoid:

- Aggressive colors
- Excessive animations
- Visual clutter
- Overwhelming dashboards
- Medical diagnosis-style interfaces
- Judgmental language
- Alarmist wording
- Excessive notifications
- Gamification that could pressure vulnerable users

The user should never feel that they are being "graded", "diagnosed", or judged.

==========================================================
# VISUAL DESIGN
==========================================================

Use a calm and modern visual system.

Design principles:

- Soft, comfortable color palette
- High readability
- Generous spacing
- Clear hierarchy
- Rounded but professional components
- Minimal visual noise
- Consistent typography
- Comfortable chat bubbles
- Clear focus states
- Subtle transitions
- Minimal animation

Do NOT use excessive gradients, flashing elements, or distracting animations.

Use color carefully because users may be emotionally distressed.

==========================================================
# ACCESSIBILITY
==========================================================

Accessibility is mandatory.

Implement:

- Semantic HTML
- Keyboard navigation
- Screen-reader support
- Proper labels
- ARIA attributes where appropriate
- Visible focus states
- Sufficient contrast
- Large readable text
- Responsive controls
- Accessible error messages
- Accessible form validation
- Reduced-motion support

Provide a reduced-motion preference.

Do not communicate important information through color alone.

==========================================================
# EMOTIONAL SAFETY UX
==========================================================

The interface must avoid making assumptions about the user's mental state.

Do NOT use labels such as:

"You are depressed."

"You have anxiety."

"You are mentally ill."

Instead use neutral language such as:

"It sounds like you're experiencing a difficult moment."

"The conversation suggests you may be experiencing significant distress."

AI-generated emotional analysis must be presented as an indication, not a diagnosis.

==========================================================
# CALM FIRST-USE EXPERIENCE
==========================================================

The first screen should be simple.

Do not overwhelm the user with many features.

Provide:

- Short welcome message
- Clear explanation of the AI assistant
- Primary "Start Conversation" action
- Optional mood check-in
- Access to support resources

Do not require users to navigate through a complicated dashboard before talking to the chatbot.

==========================================================
# PRIVACY UX
==========================================================

Clearly communicate privacy without overwhelming the user.

Provide a privacy explanation during onboarding.

Explain:

- The chatbot is an AI system.
- Conversations may be stored by the application.
- Users should avoid sharing unnecessary sensitive information.
- The system is not a replacement for professional care.

Do not display sensitive information unnecessarily.

Do not store mental-health data in localStorage.

==========================================================
# AUTHENTICATION
==========================================================

Implement:

- Registration
- Login
- Logout
- JWT authentication
- Token refresh
- Protected routes
- Role-based routes
- Session expiration handling

Roles:

- User
- Counselor
- Admin

Backend authorization remains authoritative.

Never trust frontend role information for security.

==========================================================
# APPLICATION ROUTES
==========================================================

## Public

/

 /login

/register

/privacy

/about

/support

## User

/dashboard

/chat

/chat/[conversationId]

/mood

/journal

/profile

/settings

## Counselor

/counselor/dashboard

/counselor/incidents

/counselor/incidents/[id]

## Admin

/admin/dashboard

/admin/documents

/admin/knowledge-base

/admin/users

==========================================================
# MAIN USER EXPERIENCE
==========================================================

The primary experience should be the AI conversation.

The user must be able to reach the chat quickly.

The main layout should include:

- Calm navigation
- Conversation history
- Main chat area
- User profile/settings
- Optional mood check-in
- Support/resources access

On mobile:

- Use a collapsible navigation
- Keep the chat input easily accessible
- Avoid unnecessary screen transitions

==========================================================
# AI CHAT
==========================================================

Implement:

- New conversation
- Continue conversation
- Conversation history
- Conversation search
- Conversation title
- Conversation summary
- Delete conversation
- Streaming AI response
- Message timestamps
- Loading state
- Error state
- Source citations
- Safety notices

Use real backend APIs:

/api/v1/chat

/api/v1/messages

Never generate AI responses in Next.js.

==========================================================
# CHAT INPUT UX
==========================================================

The chat input must feel comfortable and non-threatening.

Provide:

- Clear text input
- Send button
- Keyboard support
- Character handling
- Loading state
- Streaming state
- Cancel generation if backend supports it

Do not use unnecessarily complicated controls.

Provide a gentle reminder that users should avoid sharing sensitive personal information unnecessarily.

==========================================================
# AI RESPONSE DISPLAY
==========================================================

Support:

- Markdown
- Lists
- Headings
- Citations
- Safety notices
- Crisis messages

RAG sources must come from the backend.

Never invent citations.

Example:

Sources

WHO Mental Health Resource

CBT Manual

University Counseling Resource

Only display sources actually returned by the backend.

==========================================================
# AI TRANSPARENCY
==========================================================

Clearly communicate that the user is interacting with AI.

Do not make the AI appear human.

The interface should not say:

"I'm your therapist."

Instead:

"I'm an AI mental health support assistant."

==========================================================
# CRISIS DETECTION UI
==========================================================

Crisis handling is one of the MOST IMPORTANT frontend features.

The backend determines:

- Low
- Medium
- High
- Critical

The frontend must respond according to the backend result.

==========================================================
# LOW RISK
==========================================================

Continue normal conversation.

No alarming UI.

==========================================================
# MEDIUM RISK
==========================================================

Provide supportive guidance returned by the backend.

Offer appropriate coping/support options.

Do not diagnose.

==========================================================
# HIGH RISK
==========================================================

Display a clear but calm crisis-support interface.

The UI should:

- Explain that the system is concerned about the user's immediate safety.
- Encourage contacting a trusted person.
- Encourage professional/emergency support.
- Display emergency resources returned by the backend.
- Show escalation status.
- Prevent normal conversation if instructed by backend.

Avoid frightening red-screen designs.

==========================================================
# CRITICAL RISK
==========================================================

Use a dedicated crisis-support state.

The interface must prioritize immediate safety.

Display:

- Clear supportive message
- Emergency guidance
- Trusted-person guidance
- Professional support guidance
- Emergency resources returned by backend
- Escalation status

Do NOT invent emergency phone numbers.

Do NOT hardcode country-specific emergency numbers.

The backend must provide the resources.

The UI should make the next action extremely clear.

==========================================================
# CRISIS UI PRINCIPLES
==========================================================

Never:

- Shame the user
- Blame the user
- Threaten the user
- Overload the screen
- Use alarming animations
- Use excessive red
- Display a diagnosis

Use calm, direct, supportive language.

==========================================================
# COUNSELOR DASHBOARD
==========================================================

Create:

/counselor/dashboard

/counselor/incidents

/counselor/incidents/[id]

Display REAL backend data.

Counselors can:

- View incidents
- View risk level
- View escalation status
- Review conversation summary
- Review relevant messages
- Review incident details
- Update incident status

All actions must use FastAPI APIs.

==========================================================
# ADMIN DASHBOARD
==========================================================

Create:

/admin/dashboard

Display real backend information.

Possible data:

- Users
- Conversations
- Knowledge documents
- Crisis incidents
- System activity

Do not create fake statistics.

If backend analytics are unavailable, display an appropriate unavailable/empty state.

==========================================================
# MOOD TRACKING
==========================================================

Create:

/mood

Implement:

- Daily mood logging
- Mood intensity
- Mood notes
- Weekly history
- Monthly history
- Mood trends

Use:

/api/v1/mood

Charts must contain real backend data.

Never create sample chart values.

If no data exists:

"No mood records yet."

==========================================================
# JOURNAL
==========================================================

Create:

/journal

Implement:

- Create journal
- View journals
- View individual journal
- Delete journal
- AI summary
- Emotion extraction
- Keyword extraction

Use:

/api/v1/journal

Never store journal content in localStorage.

==========================================================
# PROFILE
==========================================================

Create:

/profile

Support:

- Full name
- Email
- Preferred language
- Time zone
- Mental wellness goals
- Emergency contact

Use real backend APIs.

==========================================================
# DOCUMENT MANAGEMENT
==========================================================

Admin:

/admin/documents

Support:

- Upload PDF
- Upload DOCX
- Upload TXT
- Upload Markdown
- View metadata
- Delete document
- Search documents
- Processing status

Use:

/api/v1/documents

The frontend does NOT perform RAG processing.

The backend performs:

Document
↓
Text extraction
↓
Chunking
↓
Embedding
↓
ChromaDB

==========================================================
# API ARCHITECTURE
==========================================================

Create:

src/lib/api/

or:

src/api/

Modules:

auth.api.ts

users.api.ts

chat.api.ts

messages.api.ts

rag.api.ts

mood.api.ts

journal.api.ts

documents.api.ts

crisis.api.ts

Create a centralized Axios client.

Never put API calls directly inside large UI components.

==========================================================
# TYPES
==========================================================

Create strongly typed TypeScript models corresponding to backend schemas.

Examples:

User

Role

Conversation

Message

Memory

MoodLog

Journal

KnowledgeDocument

UploadedFile

Incident

SentimentLog

Notification

Do not use "any" unless absolutely necessary.

==========================================================
# STATE MANAGEMENT
==========================================================

Use TanStack React Query for server state.

Implement:

- Queries
- Mutations
- Query invalidation
- Loading states
- Error states
- Refetching

Do not duplicate server state unnecessarily.

==========================================================
# WEBSOCKET
==========================================================

Implement real WebSocket communication if supported by backend.

Use for:

- Streaming AI responses
- Typing indicator
- Real-time crisis escalation status
- Counselor notifications where supported

Handle:

- Connection failure
- Reconnection
- Timeout
- Server error
- Connection closing

Do not simulate WebSocket messages.

==========================================================
# ERROR HANDLING
==========================================================

Handle:

400

401

403

404

409

422

429

500

Display understandable messages.

Never display raw backend stack traces.

For mental-health-related failures, use calm language.

Example:

"We're having trouble processing your message right now. Please try again."

==========================================================
# LOADING STATES
==========================================================

Use:

- Skeletons
- Spinners
- Disabled buttons
- Streaming indicators

Never display fake content while loading.

==========================================================
# EMPTY STATES
==========================================================

Implement meaningful empty states.

Examples:

"No conversations yet."

"No mood records yet."

"No journal entries yet."

"No crisis incidents available."

"No knowledge documents uploaded."

Empty states should guide users toward the next appropriate action.

==========================================================
# FORMS
==========================================================

Use:

React Hook Form

+

Zod

Validate:

- Email
- Password
- Profile information
- Mood
- Journal
- File upload
- Required fields

Backend validation remains authoritative.

==========================================================
# SECURITY
==========================================================

Implement:

- Protected routes
- JWT authentication
- Secure token handling
- Role-based UI
- Input validation
- Safe Markdown rendering
- File validation
- No sensitive data in localStorage
- No API keys in frontend
- No Groq credentials in frontend

Never expose:

GROQ_API_KEY

or other backend secrets.

==========================================================
# RESPONSIVE DESIGN
==========================================================

The application must work well on:

- Desktop
- Laptop
- Tablet
- Mobile

Mental-health users may access the chatbot from a phone.

The mobile experience must therefore receive the same design attention as desktop.

==========================================================
# ACCESSIBLE RESPONSIVE CHAT
==========================================================

On mobile:

- Keep the message input accessible.
- Avoid tiny buttons.
- Avoid horizontal scrolling.
- Keep navigation simple.
- Allow users to easily return to the conversation.
- Make crisis actions immediately visible.
- Maintain readable text sizes.

==========================================================
# REDUCED MOTION
==========================================================

Respect:

prefers-reduced-motion

Avoid unnecessary animation.

Important information must never depend on animation.

==========================================================
# INTERNATIONALIZATION READINESS
==========================================================

The architecture should be prepared for multilingual support.

Do not hardcode user-facing text throughout components.

Place UI strings in a centralized structure so additional languages can be added later.

==========================================================
# AI ETHICS IN UI
==========================================================

The frontend must support responsible AI principles.

## Transparency

Clearly identify AI-generated content.

## Privacy

Explain appropriate data handling.

## Safety

Prioritize crisis support.

## Human Oversight

Clearly communicate when a crisis incident has been escalated to a counselor.

## Non-Diagnosis

Never present AI analysis as a medical diagnosis.

## User Autonomy

Users should understand what actions they can take.

## Fairness

Avoid discriminatory or judgmental interface language.

==========================================================
# MENTAL HEALTH CONTENT PRESENTATION
==========================================================

When displaying AI-generated content:

Use:

- Supportive language
- Clear headings
- Short paragraphs
- Bullets where useful
- Comfortable spacing

Avoid:

- Long walls of text
- Excessive technical terminology
- Overwhelming information
- Judgmental wording

Allow users to comfortably read responses when emotionally distressed.

==========================================================
# NO MOCK DATA
==========================================================

ABSOLUTE RULE:

Never create application mock data.

Wrong:

const conversations = [
  { id: 1, title: "My conversation" }
]

Wrong:

const moodData = [
  { day: "Monday", mood: 8 }
]

Wrong:

const user = {
  name: "John"
}

Wrong:

const fakeAIResponse = "You seem stressed."

These are prohibited.

Only controlled test fixtures may contain test data, and they must never be used as application data.

==========================================================
# TESTING
==========================================================

Use:

- Vitest
- React Testing Library

Test:

- Login
- Registration
- Protected routes
- Role-based navigation
- Chat UI
- Mood tracking
- Journal
- Crisis UI
- Document upload
- API error handling
- Loading states
- Empty states
- Accessibility
- Responsive critical components

Tests must not introduce mock data into the actual application.

==========================================================
# PROJECT STRUCTURE
==========================================================

Use a clean Next.js structure such as:

src/

app/

components/

  common/

  layout/

  chat/

  mood/

  journal/

  crisis/

  documents/

  dashboard/

hooks/

lib/

  api/

  auth/

services/

schemas/

types/

utils/

constants/

providers/

tests/

public/

==========================================================
# DOCUMENTATION
==========================================================

Generate:

README.md

Installation Guide

Environment Configuration

Frontend Architecture

API Integration Documentation

Authentication Flow

WebSocket Documentation

Mental Health UX Guidelines

Accessibility Guidelines

Component Architecture

Project Structure Documentation

==========================================================
# DEVELOPMENT ORDER
==========================================================

Implement one module at a time.

PHASE 1

Next.js + TypeScript setup

PHASE 2

Tailwind + design system

PHASE 3

API client + types

PHASE 4

Authentication

PHASE 5

Protected routes + role-based navigation

PHASE 6

Mental-health-focused application layout

PHASE 7

Chat interface

PHASE 8

Real-time AI streaming

PHASE 9

Mood tracking

PHASE 10

Journal

PHASE 11

Crisis detection UI

PHASE 12

Counselor dashboard

PHASE 13

Admin dashboard

PHASE 14

Knowledge-base/document management

PHASE 15

Profile/settings

PHASE 16

Accessibility + responsive refinement

PHASE 17

Testing

PHASE 18

Documentation

==========================================================
# FINAL INTEGRATION REQUIREMENT
==========================================================

Before declaring the frontend complete, verify:

- Registration works with FastAPI.
- Login works with FastAPI.
- JWT authentication works.
- Token refresh works.
- Protected routes work.
- Role-based access works.
- Chat uses real backend data.
- AI responses come from the backend.
- Streaming works.
- RAG sources come from the backend.
- Mood data comes from the backend.
- Journal data comes from the backend.
- Crisis information comes from the backend.
- Crisis escalation UI works.
- Counselor incidents come from the backend.
- Documents upload to the backend.
- Admin data comes from the backend.
- Loading states work.
- Error states work.
- Empty states work.
- Accessibility requirements are implemented.
- Mobile experience works.
- No mock application data exists.
- No API keys exist in the frontend.

The final result must be a COMPLETE, FUNCTIONAL Next.js frontend connected to the real FastAPI backend.

Do not build a visual prototype.

Do not generate placeholder functionality.

Do not generate mock application data.

Do not skip functionality.

Implement, test, and integrate each module before moving to the next.