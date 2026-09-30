# API Integration

The frontend communicates with the FastAPI backend strictly through centralized API modules found in `lib/api/`.

## Axios Instance (`client.ts`)

All requests go through a single Axios instance (`apiClient`). This centralizes:
- **Base URL Config**: Loaded from `process.env.NEXT_PUBLIC_API_BASE_URL`.
- **Interceptors**: 
  - *Request*: Automatically attaches the JWT `access_token` from `localStorage`.
  - *Response*: Catches `401 Unauthorized` errors, attempts to refresh the token using the `refresh_token`, and replays the failed request transparently.
- **Error Formatting**: Standardizes error objects into `ApiError` shapes for consistent UI rendering.

## API Modules

Endpoints are logically grouped into service modules:
- `auth.api.ts`: Login, register, refresh, logout
- `chat.api.ts`: Conversation CRUD, message history, SSE streaming initiation
- `messages.api.ts`: Direct message manipulation
- `mood.api.ts`: Mood logging, trends, history
- `journal.api.ts`: Journal CRUD and AI summarization
- `crisis.api.ts`: Admin/Counselor crisis incident management
- `documents.api.ts`: Admin RAG document upload and management
- `rag.api.ts`: Knowledge base search
- `users.api.ts`: Profile management

## Typing

Every API request and response is strictly typed using interfaces in `types/index.ts`. These interfaces perfectly mirror the Pydantic schemas defined in the FastAPI backend, ensuring complete type safety across the network boundary.
