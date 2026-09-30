# Emora AI — Frontend Documentation

Welcome to the Emora AI frontend documentation. Emora is an AI-powered mental health chatbot built with modern web technologies, prioritizing accessibility, emotional safety, and real-time interaction.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest) + Axios
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library + MSW

## Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or pnpm
- Backend API running locally (see backend docs)

### Setup
1. Clone the repository and navigate to the frontend directory.
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and configure your API URL.
4. Run `npm run dev` to start the development server.

### Available Scripts
- `npm run dev`: Start dev server
- `npm run build`: Build production bundle
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run Vitest unit & integration tests
- `npm run test:ui`: Run tests with Vitest UI
- `npm run test:coverage`: Generate test coverage report

## Documentation Directory
- `ARCHITECTURE.md` - Core patterns, state management, and structure
- `API_INTEGRATION.md` - How the frontend talks to FastAPI
- `AUTH_FLOW.md` - JWT authentication and Role-based access
- `WEBSOCKET.md` - Handling SSE streams for the chat interface
- `MENTAL_HEALTH_UX.md` - UI/UX principles applied to mental wellness
- `ACCESSIBILITY.md` - A11y implementation details
