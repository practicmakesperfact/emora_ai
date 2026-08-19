// ============================================================
// Emora AI — Auth API
// POST /auth/register, /auth/login, /auth/refresh
// ============================================================

import apiClient from './client';
import type { LoginRequest, Token, UserCreate, User } from '@/types';

export const authApi = {
  register: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/login', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<Token> => {
    const response = await apiClient.post<Token>('/auth/refresh', null, {
      params: { refresh_token: refreshToken },
    });
    return response.data;
  },
};
