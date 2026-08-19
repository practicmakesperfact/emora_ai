// ============================================================
// Emora AI — Chat API
// All conversation and message endpoints
// ============================================================

import apiClient from './client';
import type {
  Conversation,
  ConversationCreate,
  ConversationSummaryResponse,
  ConversationSearchResponse,
  Message,
  PaginationParams,
} from '@/types';

export const chatApi = {
  /** POST /chat — Create a new conversation */
  createConversation: async (data: ConversationCreate = {}): Promise<Conversation> => {
    const res = await apiClient.post<Conversation>('/chat', data);
    return res.data;
  },

  /** GET /chat — List user's conversations */
  listConversations: async (params: PaginationParams = {}): Promise<Conversation[]> => {
    const res = await apiClient.get<Conversation[]>('/chat', { params });
    return res.data;
  },

  /** GET /chat/search — Search conversations */
  searchConversations: async (q: string, limit = 20): Promise<ConversationSearchResponse> => {
    const res = await apiClient.get<ConversationSearchResponse>('/chat/search', {
      params: { q, limit },
    });
    return res.data;
  },

  /** DELETE /chat/{id} — Delete a conversation */
  deleteConversation: async (conversationId: number): Promise<void> => {
    await apiClient.delete(`/chat/${conversationId}`);
  },

  /** GET /chat/{id}/messages — Get message history */
  getMessages: async (
    conversationId: number,
    params: PaginationParams = {}
  ): Promise<Message[]> => {
    const res = await apiClient.get<Message[]>(`/chat/${conversationId}/messages`, { params });
    return res.data;
  },

  /** POST /chat/{id}/summary — Generate conversation summary */
  generateSummary: async (conversationId: number): Promise<ConversationSummaryResponse> => {
    const res = await apiClient.post<ConversationSummaryResponse>(
      `/chat/${conversationId}/summary`
    );
    return res.data;
  },

  /**
   * POST /chat/{id}/messages — Send a message (SSE streaming)
   * Returns the raw fetch Response for SSE handling.
   */
  sendMessageStream: async (
    conversationId: number,
    content: string,
    token: string
  ): Promise<Response> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${baseUrl}/chat/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || `HTTP ${response.status}`);
    }

    return response;
  },
};
