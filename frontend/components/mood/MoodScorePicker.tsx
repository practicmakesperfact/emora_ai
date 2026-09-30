// ============================================================
// Emora AI — MoodScorePicker Component
// 1 to 10 radio group picker for mood logging
// ============================================================

import React from 'react';
import { getMoodLabel, getMoodEmoji, cn } from '@/utils';

interface MoodScorePickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function MoodScorePicker({ value, onChange, error }: MoodScorePickerProps) {
  return (
    <div>
      <div className="flex gap-1 flex-wrap" role="radiogroup" aria-label="Mood score">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 min-w-[32px] py-2 rounded-xl text-sm font-medium border transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              value === n
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
            )}
            role="radio"
            aria-checked={value === n}
            aria-label={`Score ${n}: ${getMoodLabel(n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-center text-sm mt-2">
        <span className="text-xl" aria-hidden>
          {getMoodEmoji(value)}
        </span>{' '}
        <span className="text-slate-600">{getMoodLabel(value)}</span>
      </p>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
