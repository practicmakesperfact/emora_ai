// ============================================================
// Emora AI — useConversations Hook
// React Query hooks for conversation management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/api/chat.api';
import { ROUTES } from '@/constants';
import type { ConversationCreate, PaginationParams } from '@/types';

export const CONVERSATIONS_KEY = ['conversations'] as const;

/** List all conversations */
export function useConversations(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, params],
    queryFn: () => chatApi.listConversations(params),
  });
}

/** Create a new conversation and navigate to it */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: ConversationCreate = {}) => chatApi.createConversation(data),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      router.push(`${ROUTES.CHAT}/${conv.id}`);
    },
  });
}

/** Delete a conversation by ID */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => chatApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

/** Get messages for a specific conversation */
export function useConversationMessages(conversationId: number, params: PaginationParams = {}) {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => chatApi.getMessages(conversationId, params),
    enabled: !isNaN(conversationId) && conversationId > 0,
  });
}

/** Generate a conversation summary */
export function useGenerateSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.generateSummary(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
