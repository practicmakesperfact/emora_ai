// ============================================================
// Emora AI — Chat Page (/chat)
// Conversation list + new conversation
// ============================================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, Search, Trash2, Clock } from 'lucide-react';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { EmptyState, LoadingPage, ErrorMessage } from '@/components/common/Feedback';
import { Modal } from '@/components/common/Modal';
import { formatRelativeTime, getErrorMessage, truncate } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Conversation } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: conversations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () => chatApi.createConversation({ title: 'New Conversation' }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/chat/${conv.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteConversation(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.summary?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingPage />;
  if (error) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Conversations</h1>
            <p className="text-sm text-slate-500">
              {conversations?.length || 0} conversation{conversations?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Chat
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          <Input
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {createMutation.error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-100">
              {getApiErrorMessage(createMutation.error)}
            </div>
          )}

          {!filtered || filtered.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Start a new conversation to begin talking with your AI support assistant."
              icon={<MessageCircle className="w-12 h-12" />}
              action={
                <Button
                  onClick={() => createMutation.mutate()}
                  isLoading={createMutation.isPending}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Start a Conversation
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2" aria-label="Conversation list">
              {filtered.map((conv) => (
                <li key={conv.id}>
                  <ConversationItem
                    conversation={conv}
                    onOpen={() => router.push(`/chat/${conv.id}`)}
                    onDelete={() => setDeleteId(conv.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete conversation?"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          This will permanently delete the conversation and all its messages.
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setDeleteId(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
        {deleteMutation.error && (
          <p className="mt-3 text-xs text-rose-600">
            {getApiErrorMessage(deleteMutation.error)}
          </p>
        )}
      </Modal>
    </div>
  );
}

function ConversationItem({
  conversation,
  onOpen,
  onDelete,
}: {
  conversation: Conversation;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-sm transition-all">
      <button
        onClick={onOpen}
        className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl"
        aria-label={`Open conversation: ${conversation.title}`}
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-indigo-500" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-800 truncate">
            {conversation.title}
          </p>
          {conversation.summary ? (
            <p className="text-xs text-slate-400 truncate">
              {truncate(conversation.summary, 60)}
            </p>
          ) : (
            <p className="text-xs text-slate-300 italic">No summary yet</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-300 shrink-0">
          <Clock className="w-3 h-3" aria-hidden />
          <span className="text-xs">{formatRelativeTime(conversation.updated_at)}</span>
        </div>
      </button>

      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        aria-label={`Delete conversation: ${conversation.title}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
