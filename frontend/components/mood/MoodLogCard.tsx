// ============================================================
// Emora AI — MoodLogCard Component
// Displays a single mood log entry in the history list
// ============================================================

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import {
  getMoodEmoji,
  getMoodLabel,
  getMoodColor,
  formatDateTime,
  formatDate,
} from '@/utils';
import type { MoodLog } from '@/types';

interface MoodLogCardProps {
  log: MoodLog;
  onDelete: (id: number) => void;
}

export function MoodLogCard({ log, onDelete }: MoodLogCardProps) {
  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="shrink-0 flex flex-col items-center">
        <span className="text-2xl" aria-hidden>
          {getMoodEmoji(log.score)}
        </span>
        <span className={`text-sm font-bold mt-0.5 ${getMoodColor(log.score)}`}>
          {log.score}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-800">
          {getMoodLabel(log.score)}
        </p>
        <p className="text-xs text-slate-400 mb-2">
          {formatDateTime(log.created_at)}
        </p>
        {log.emotions && log.emotions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {log.emotions.map((e) => (
              <Badge key={e} variant="info" size="sm">
                {e}
              </Badge>
            ))}
          </div>
        )}
        {log.mood_notes && (
          <p className="text-xs text-slate-600 leading-relaxed">
            {log.mood_notes}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
        aria-label={`Delete mood log from ${formatDate(log.created_at)}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
