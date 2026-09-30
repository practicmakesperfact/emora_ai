// ============================================================
// Emora AI — ConversationItem Component
// Represents a single conversation in the chat list
// ============================================================

import React from 'react';
import { MessageCircle, Trash2, Clock } from 'lucide-react';
import { formatRelativeTime, truncate } from '@/utils';
import type { Conversation } from '@/types';

interface ConversationItemProps {
  conversation: Conversation;
  onOpen: () => void;
  onDelete: () => void;
}

export function ConversationItem({
  conversation,
  onOpen,
  onDelete,
}: ConversationItemProps) {
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
