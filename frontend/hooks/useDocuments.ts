// ============================================================
// Emora AI — useDocuments Hook
// React Query hooks for knowledge document management
// Admin only
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents.api';

export const DOCUMENTS_KEY = ['documents'] as const;

interface UploadDocumentArgs {
  file: File;
  title: string;
  author?: string;
  source?: string;
}

/** List all knowledge documents */
export function useDocuments(skip = 0, limit = 200) {
  return useQuery({
    queryKey: [...DOCUMENTS_KEY, { skip, limit }],
    queryFn: () => documentsApi.listDocuments(skip, limit),
  });
}

/** Upload a new knowledge document */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title, author, source }: UploadDocumentArgs) =>
      documentsApi.uploadDocument(file, title, author, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

/** Delete a knowledge document */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}
