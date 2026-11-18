// ============================================================
// Emora AI — Users API
// GET /users/me, PUT /users/me, GET /users/{id}, DELETE /users/{id}
// GET /users/me/export — data export
// DELETE /users/me    — self-delete account
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

  /**
   * GET /users/me/export — Download all personal data as a JSON blob.
   * Returns a Blob that the caller can turn into a file download.
   */
  exportMyData: async (): Promise<Blob> => {
    const res = await apiClient.get<Blob>('/users/me/export', {
      responseType: 'blob',
    });
    return res.data;
  },

  /**
   * DELETE /users/me — Permanently delete the authenticated user's account
   * and all associated data (conversations, mood logs, journal entries).
   * Returns void — the caller must sign the user out after this.
   */
  deleteMyAccount: async (): Promise<void> => {
    await apiClient.delete('/users/me');
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
