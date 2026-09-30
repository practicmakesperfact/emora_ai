// ============================================================
// Emora AI — JournalCard Component
// Displays a single journal entry snippet in a list
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Calendar, Trash2 } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatDateTime } from '@/utils';
import type { Journal } from '@/types';

interface JournalCardProps {
  entry: Journal;
  onDelete: (id: number) => void;
}

export function JournalCard({ entry, onDelete }: JournalCardProps) {
  return (
    <Card hover className="flex flex-col justify-between h-full group relative">
      <div>
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Calendar className="w-3.5 h-3.5" aria-hidden />
          <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
        </div>

        {/* Content Snippet */}
        <p className="text-sm text-slate-700 mb-4 line-clamp-3">
          {entry.content}
        </p>

        {/* AI Summary */}
        {entry.ai_summary && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
            <p className="text-xs font-semibold text-indigo-700 mb-1">
              AI Summary
            </p>
            <p className="text-xs text-slate-600 line-clamp-2">
              {entry.ai_summary}
            </p>
          </div>
        )}
      </div>

      <div>
        {/* Tags */}
        {entry.emotions && entry.emotions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {entry.emotions.slice(0, 3).map((emo) => (
              <Badge key={emo} variant="success" size="sm">
                {emo}
              </Badge>
            ))}
          </div>
        )}

        {/* Detail Link */}
        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/journal/${entry.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
          >
            Read Full Entry &rarr;
          </Link>

          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label={`Delete journal entry from ${formatDateTime(entry.created_at)}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </Card>
  );
}
