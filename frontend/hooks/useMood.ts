// ============================================================
// Emora AI — useMood Hook
// React Query hooks for mood logging and trends
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodApi } from '@/lib/api/mood.api';
import type { MoodLogCreate } from '@/types';

type MoodPeriod = 'weekly' | 'monthly';

export const MOOD_HISTORY_KEY = (period?: string) =>
  period ? ['mood-history', period] : ['mood-history'];

export const MOOD_TRENDS_KEY = (period: MoodPeriod) => ['mood-trends', period];

/** List mood history for a given period */
export function useMoodHistory(period: 'weekly' | 'monthly' | 'all' = 'weekly') {
  return useQuery({
    queryKey: MOOD_HISTORY_KEY(period),
    queryFn: () => moodApi.getMoodHistory(period),
  });
}

/** Get mood trends (daily averages + summary stats) */
export function useMoodTrends(period: MoodPeriod = 'weekly') {
  return useQuery({
    queryKey: MOOD_TRENDS_KEY(period),
    queryFn: () => moodApi.getMoodTrends(period),
  });
}

/** Log a new mood entry */
export function useLogMood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MoodLogCreate) => moodApi.logMood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      queryClient.invalidateQueries({ queryKey: ['mood-trends'] });
    },
  });
}

/** Delete a mood log entry */
export function useDeleteMoodLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => moodApi.deleteMoodLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      queryClient.invalidateQueries({ queryKey: ['mood-trends'] });
    },
  });
}
