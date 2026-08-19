// ============================================================
// Emora AI — Auth Provider
// Manages authentication state across the application
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

// ─── Context Types ─────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
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

  // Load user profile on mount (if token exists)
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

  // ── Login ────────────────────────────────────────────────────────────────

  const login = useCallback(async (credentials: LoginRequest) => {
    const tokens = await authApi.login(credentials);
    saveTokens(tokens.access_token, tokens.refresh_token);
    const profile = await usersApi.getMe();
    setUser(profile);
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────

  const register = useCallback(async (data: UserCreate) => {
    await authApi.register(data);
    // Auto-login after registration
    const tokens = await authApi.login({ email: data.email, password: data.password });
    saveTokens(tokens.access_token, tokens.refresh_token);
    const profile = await usersApi.getMe();
    setUser(profile);
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push('/login');
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
