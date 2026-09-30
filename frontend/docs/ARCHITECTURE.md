# Frontend Architecture

Emora uses Next.js with the App Router, combining server-side capabilities with rich client-side interactivity.

## Folder Structure

```
frontend/
├── app/              # Next.js App Router (pages and layouts)
│   ├── (auth)/       # Public auth routes (login/register)
│   ├── (protected)/  # Routes requiring login (dashboard, chat, mood, etc)
│   ├── admin/        # Routes requiring Admin role
│   └── counselor/    # Routes requiring Counselor/Admin role
├── components/       # Reusable React components
│   ├── common/       # UI primitives (Button, Card, Input, etc)
│   ├── layout/       # Layout structures (Sidebar, AppLayout)
│   └── [feature]/    # Feature-specific components (chat, mood, journal)
├── hooks/            # Custom React hooks (React Query wrappers)
├── lib/              # Utility libraries
│   └── api/          # Axios instance and API service modules
├── providers/        # React Context providers (Auth, Query)
├── schemas/          # Zod validation schemas
├── types/            # TypeScript interfaces (matching backend models)
└── utils/            # Helper functions (formatting, tailwind merge)
```

## State Management

We use **TanStack React Query** as our primary state management tool. Since Emora is fundamentally a data-driven application interacting with a REST API, React Query handles caching, deduping, background updates, and loading states automatically.

- **No Redux/Zustand**: We deliberately avoid global client-state managers.
- **Server State**: Managed by React Query (`hooks/useConversations`, `hooks/useMood`, etc).
- **Client State**: Managed locally via `useState` and `useReducer` within components.
- **Auth State**: Managed by a custom `AuthProvider` context wrapping the app.

## Component Design

Emora follows a **Container/Presenter** (Smart/Dumb) component pattern:
- **Pages** (`app/**/page.tsx`) act as containers. They fetch data via hooks and pass props down.
- **Components** (`components/**`) act as presenters. They take props, emit events via callbacks, and contain no direct API calls.
