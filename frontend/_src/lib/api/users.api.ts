// ============================================================
// Emora AI — Users API
// GET /users/me, PUT /users/me, GET /users/{id}, DELETE /users/{id}
// ============================================================

import apiClient from './client';
import type { User, UserUpdate } from '@/types';

export const usersApi = {
  /** GET /users/me — Current user profile */
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/users/me');
    return res.data;
  },

  /** PUT /users/me — Update current user profile */
  updateMe: async (data: UserUpdate): Promise<User> => {
    const res = await apiClient.put<User>('/users/me', data);
    return res.data;
  },

  /** GET /users/{id} — Admin/Counselor: get any user */
  getUserById: async (userId: number): Promise<User> => {
    const res = await apiClient.get<User>(`/users/${userId}`);
    return res.data;
  },

  /** DELETE /users/{id} — Admin only: delete a user */
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
