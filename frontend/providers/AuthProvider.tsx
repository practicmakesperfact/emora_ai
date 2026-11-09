// ============================================================
// Emora AI — Auth Provider
// Manages authentication state across the application.
//
// Key design: login() and register() now RETURN the User profile
// so callers can redirect immediately without waiting for the
// async React state update cycle.
// ============================================================

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth.api';
import { usersApi } from '@/lib/api/users.api';
import type { User, LoginRequest, UserCreate } from '@/types';
import { ROUTES, ROLES } from '@/constants';

// ─── Role-based Home Helper ────────────────────────────────────────────────

/**
 * Returns the correct landing page for a given user based on their role.
 *   Admin / Counselor → /counselor/dashboard
 *   User              → /dashboard
 */
export function getRoleHome(user: User | null): string {
  const role = user?.role?.name;
  if (role === ROLES.ADMIN || role === ROLES.COUNSELOR) {
    return ROUTES.COUNSELOR_DASHBOARD;
  }
  return ROUTES.DASHBOARD;
}

// ─── Context Types ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Logs in and returns the fetched User profile for immediate role-based redirect */
  login: (credentials: LoginRequest) => Promise<User>;
  /** Registers, auto-logs in, and returns the User profile */
  register: (data: UserCreate) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Token Helpers ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'emora_access_token';
const REFRESH_KEY = 'emora_refresh_token';

function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile on mount (if a token already exists in localStorage)
  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await usersApi.getMe();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Login ─────────────────────────────────────────────────────────────────

  /**
   * Authenticates the user, saves tokens, fetches profile, updates context.
   * Returns the User object so the caller can redirect immediately.
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const tokens = await authApi.login(credentials);
    saveTokens(tokens.access_token, tokens.refresh_token);
    const profile = await usersApi.getMe();
    setUser(profile);
    return profile; // ← caller uses this for instant redirect
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────

  /**
   * Registers a new account, auto-logs in, fetches profile, updates context.
   * Returns the User object so the caller can redirect immediately.
   */
  const register = useCallback(async (data: UserCreate): Promise<User> => {
    await authApi.register(data);
    // Auto-login after successful registration
    const tokens = await authApi.login({ email: data.email, password: data.password });
    saveTokens(tokens.access_token, tokens.refresh_token);
    const profile = await usersApi.getMe();
    setUser(profile);
    return profile; // ← caller uses this for instant redirect
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
