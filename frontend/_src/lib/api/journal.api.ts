// ============================================================
// Emora AI — Journal API
// POST /journal, GET /journal/history, GET /journal/{id}, DELETE /journal/{id}
// ============================================================

import apiClient from './client';
import type { Journal, JournalCreate } from '@/types';

export const journalApi = {
  /** POST /journal — Create a journal entry (triggers AI analysis) */
  createEntry: async (data: JournalCreate): Promise<Journal> => {
    const res = await apiClient.post<Journal>('/journal', data);
    return res.data;
  },

  /** GET /journal/history — List journal entries */
  getHistory: async (skip = 0, limit = 50): Promise<Journal[]> => {
    const res = await apiClient.get<Journal[]>('/journal/history', {
      params: { skip, limit },
    });
    return res.data;
  },

  /** GET /journal/{id} — Get a specific journal entry */
  getEntry: async (journalId: number): Promise<Journal> => {
    const res = await apiClient.get<Journal>(`/journal/${journalId}`);
    return res.data;
  },

  /** DELETE /journal/{id} — Delete a journal entry */
  deleteEntry: async (journalId: number): Promise<void> => {
    await apiClient.delete(`/journal/${journalId}`);
  },
};
