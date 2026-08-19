// ============================================================
// Emora AI — RAG API
// GET /rag/search
// ============================================================

import apiClient from './client';
import type { RAGSearchResponse } from '@/types';

export const ragApi = {
  /** GET /rag/search — Search the knowledge base */
  search: async (query: string, topK = 5): Promise<RAGSearchResponse> => {
    const res = await apiClient.get<RAGSearchResponse>('/rag/search', {
      params: { query, top_k: topK },
    });
    return res.data;
  },
};
