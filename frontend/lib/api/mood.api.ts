// ============================================================
// Emora AI — Mood API
// POST /mood, GET /mood/history, GET /mood/trends, DELETE /mood/{id}
// ============================================================

import apiClient from './client';
import type { MoodLog, MoodLogCreate, MoodTrendsResponse } from '@/types';

export const moodApi = {
  /** POST /mood — Log a mood entry */
  logMood: async (data: MoodLogCreate): Promise<MoodLog> => {
    const res = await apiClient.post<MoodLog>('/mood', data);
    return res.data;
  },

  /** GET /mood/history — Get mood history (weekly|monthly|all) */
  getMoodHistory: async (period: 'weekly' | 'monthly' | 'all' = 'weekly'): Promise<MoodLog[]> => {
    const res = await apiClient.get<MoodLog[]>('/mood/history', { params: { period } });
    return res.data;
  },

  /** GET /mood/trends — Get aggregated mood trends */
  getMoodTrends: async (period: 'weekly' | 'monthly' = 'weekly'): Promise<MoodTrendsResponse> => {
    const res = await apiClient.get<MoodTrendsResponse>('/mood/trends', { params: { period } });
    return res.data;
  },

  /** DELETE /mood/{id} — Delete a mood log entry */
  deleteMoodLog: async (logId: number): Promise<void> => {
    await apiClient.delete(`/mood/${logId}`);
  },
};
