// ============================================================
// Emora AI — Documents API
// POST /documents/upload, GET /documents, DELETE /documents/{id}
// Admin only
// ============================================================

import apiClient from './client';
import type { KnowledgeDocument } from '@/types';

export const documentsApi = {
  /** POST /documents/upload — Upload a knowledge document */
  uploadDocument: async (
    file: File,
    title: string,
    author?: string,
    source?: string
  ): Promise<KnowledgeDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (author) formData.append('author', author);
    if (source) formData.append('source', source);

    const res = await apiClient.post<KnowledgeDocument>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** GET /documents — List all documents */
  listDocuments: async (skip = 0, limit = 100): Promise<KnowledgeDocument[]> => {
    const res = await apiClient.get<KnowledgeDocument[]>('/documents', {
      params: { skip, limit },
    });
    return res.data;
  },

  /** DELETE /documents/{id} — Delete a document */
  deleteDocument: async (documentId: number): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },
};
