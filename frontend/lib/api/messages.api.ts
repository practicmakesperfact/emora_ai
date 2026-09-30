// ============================================================
// Emora AI — Messages API
// Direct message-level access via /api/v1/messages
// ============================================================

import apiClient from './client';
import type { Message, PaginationParams } from '@/types';

export const messagesApi = {
  /**
   * GET /messages
   * List all messages for the authenticated user across all conversations.
   */
  listMessages: async (params: PaginationParams = {}): Promise<Message[]> => {
    const res = await apiClient.get<Message[]>('/messages', { params });
    return res.data;
  },

  /**
   * GET /messages/{id}
   * Get a single message by ID.
   */
  getMessage: async (messageId: number): Promise<Message> => {
    const res = await apiClient.get<Message>(`/messages/${messageId}`);
    return res.data;
  },

  /**
   * DELETE /messages/{id}
   * Delete a specific message by ID.
   */
  deleteMessage: async (messageId: number): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },
};
