// ============================================================
// Emora AI — useJournal Hook
// React Query hooks for journal entries
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/lib/api/journal.api';
import type { JournalCreate } from '@/types';

export const JOURNALS_KEY = ['journals'] as const;
export const JOURNAL_KEY = (id: number) => ['journal', id] as const;

/** List all journal entries */
export function useJournals(skip = 0, limit = 50) {
  return useQuery({
    queryKey: [...JOURNALS_KEY, { skip, limit }],
    queryFn: () => journalApi.getHistory(skip, limit),
  });
}

/** Get a single journal entry */
export function useJournal(journalId: number) {
  return useQuery({
    queryKey: JOURNAL_KEY(journalId),
    queryFn: () => journalApi.getEntry(journalId),
    enabled: !isNaN(journalId) && journalId > 0,
  });
}

/** Create a new journal entry with AI analysis */
export function useCreateJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JournalCreate) => journalApi.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNALS_KEY });
    },
  });
}

/** Delete a journal entry */
export function useDeleteJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => journalApi.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOURNALS_KEY });
    },
  });
}
