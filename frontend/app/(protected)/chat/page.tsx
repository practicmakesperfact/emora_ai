// ============================================================
// Emora AI — Chat Page (/chat)
// Step 7: "New Chat" goes to /chat/new (no DB creation until first message).
//         Inline rename. Title shown instead of "Conversation #N".
//         Delete with confirmation. Empty state.
// ============================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, Search, Trash2, Clock, Activity, Pencil, Check, X } from 'lucide-react';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { EmptyState, LoadingPage, ErrorMessage } from '@/components/common/Feedback';
import { Modal } from '@/components/common/Modal';
import { formatRelativeTime, getErrorMessage, truncate } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Conversation, DailyUsage } from '@/types';

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

  // Daily usage — soft informational limit (100 msgs/day)
  const { data: dailyUsage } = useQuery<DailyUsage>({
    queryKey: ['daily-usage'],
    queryFn: () => chatApi.getDailyUsage(),
    refetchInterval: 60_000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chatApi.deleteConversation(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      chatApi.renameConversation(id, title),
    onSuccess: () => {
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
          {/* New Chat — navigates to /chat/new WITHOUT creating in DB */}
          <Button
            onClick={() => router.push('/chat/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Chat
          </Button>
        </div>

        {/* Daily Usage Bar */}
        {dailyUsage && <DailyUsageBar usage={dailyUsage} />}
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
          {!filtered || filtered.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Start a new conversation to begin talking with your AI support assistant."
              icon={<MessageCircle className="w-12 h-12" />}
              action={
                <Button
                  onClick={() => router.push('/chat/new')}
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
                    onRename={(newTitle) => renameMutation.mutate({ id: conv.id, title: newTitle })}
                    isRenaming={renameMutation.isPending}
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

// ─── Daily Usage Bar ─────────────────────────────────────────────────────────
function DailyUsageBar({ usage }: { usage: DailyUsage }) {
  const pct = Math.min(usage.usage_percent, 100);
  const isHigh = usage.is_approaching_limit;

  const barColor = isHigh ? 'bg-amber-400' : 'bg-indigo-400';
  const textColor = isHigh ? 'text-amber-700' : 'text-slate-500';
  const bgTrack = isHigh ? 'bg-amber-100' : 'bg-slate-100';
  const containerBg = isHigh ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100';

  return (
    <div
      className={`mt-3 max-w-3xl mx-auto rounded-xl border px-4 py-2.5 ${containerBg}`}
      role="status"
      aria-label={`Daily usage: ${usage.messages_today} of ${usage.daily_soft_limit} messages`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
          <Activity className="w-3 h-3" aria-hidden />
          <span>Today&apos;s usage</span>
          {isHigh && (
            <span className="ml-1 text-amber-600 font-semibold">— taking a break can help</span>
          )}
        </div>
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
          {usage.messages_today} / {usage.daily_soft_limit} messages
        </span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${bgTrack}`} aria-hidden>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({
  conversation,
  onOpen,
  onDelete,
  onRename,
  isRenaming,
}: {
  conversation: Conversation;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  isRenaming: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  function cancelRename() {
    setDraft(conversation.title);
    setEditing(false);
  }

  // Show a friendly title — never raw "New Conversation"
  const displayTitle =
    conversation.title === 'New Conversation' ? 'Untitled conversation' : conversation.title;

  return (
    <div className="group flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-sm transition-all">
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 text-indigo-500" aria-hidden />
      </div>

      {/* Title + summary — editable inline */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              maxLength={100}
              className="flex-1 min-w-0 text-sm font-medium text-slate-800 border-b border-indigo-400 focus:outline-none bg-transparent py-0.5"
              aria-label="Rename conversation"
            />
            <button
              onClick={commitRename}
              disabled={isRenaming}
              className="text-emerald-500 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
              aria-label="Save rename"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={cancelRename}
              className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
              aria-label="Cancel rename"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpen}
            className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
            aria-label={`Open conversation: ${displayTitle}`}
          >
            <p className="font-medium text-sm text-slate-800 truncate">{displayTitle}</p>
            {conversation.summary ? (
              <p className="text-xs text-slate-400 truncate">{truncate(conversation.summary, 60)}</p>
            ) : (
              <p className="text-xs text-slate-300 italic">No messages yet</p>
            )}
          </button>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 text-slate-300 shrink-0">
        <Clock className="w-3 h-3" aria-hidden />
        <span className="text-xs">{formatRelativeTime(conversation.updated_at)}</span>
      </div>

      {/* Actions — rename + delete, fade in on hover */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => { setDraft(conversation.title); setEditing(true); }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label={`Rename conversation: ${displayTitle}`}
          >
            <Pencil className="w-4 h-4" aria-hidden />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label={`Delete conversation: ${displayTitle}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
