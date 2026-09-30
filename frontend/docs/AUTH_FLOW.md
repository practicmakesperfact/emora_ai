# Authentication Flow

Emora uses stateless JWT (JSON Web Token) authentication.

## Token Storage
- **Access Token**: Stored in memory / `localStorage` (short-lived, 30-60 mins).
- **Refresh Token**: Stored in `localStorage` (long-lived, 7+ days).

*Security Note: Because Emora is a Next.js SPA for its interactive parts, we use `localStorage`. If migrating to SSR heavily, these should be moved to HttpOnly cookies.*

## AuthProvider Context

The `AuthProvider` (`providers/AuthProvider.tsx`) wraps the entire application and is responsible for:
1. Bootstrapping user state on initial load by checking for tokens.
2. Exposing `login`, `register`, and `logout` methods to the rest of the app.
3. Fetching the `/users/me` profile once authenticated to store user metadata and role information.

## Route Protection

Route protection is handled at the layout level:
- `app/(protected)/layout.tsx`: Checks if `isAuthenticated`. If not, redirects to `/login`.
- `app/admin/layout.tsx`: Checks if user is authenticated AND role is `Admin`. If not, redirects to `/dashboard` or `/login`.
- `app/counselor/layout.tsx`: Checks for `Counselor` or `Admin` role.

## Token Refresh

The Axios interceptor in `lib/api/client.ts` automatically handles token refreshing:
1. API returns 401.
2. Interceptor pauses the request queue.
3. Calls `/auth/refresh` with the refresh token.
4. On success, updates tokens and replays paused requests.
5. On failure, logs the user out and redirects to login.
