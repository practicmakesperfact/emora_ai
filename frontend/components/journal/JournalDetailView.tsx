// ============================================================
// Emora AI — JournalDetailView Component
// Displays full journal entry text and AI analysis side-by-side
// ============================================================

import React from 'react';
import { Smile, Key } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { Journal } from '@/types';

interface JournalDetailViewProps {
  entry: Journal;
}

export function JournalDetailView({ entry }: JournalDetailViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main entry text */}
      <div className="md:col-span-2 space-y-4">
        <Card padding="lg">
          <h2 className="sr-only">Entry text</h2>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
            {entry.content}
          </p>
        </Card>
      </div>

      {/* AI Analysis sidebar */}
      <div className="space-y-4">
        {/* Summary */}
        {entry.ai_summary && (
          <Card>
            <h3 className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">
              AI Summary
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {entry.ai_summary}
            </p>
          </Card>
        )}

        {/* Emotions */}
        {entry.emotions && entry.emotions.length > 0 && (
          <Card>
            <h3 className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" aria-hidden />
              Emotions
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.emotions.map((emo) => (
                <Badge key={emo} variant="success" size="sm">
                  {emo}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Keywords */}
        {entry.keywords && entry.keywords.length > 0 && (
          <Card>
            <h3 className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" aria-hidden />
              Keywords
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entry.keywords.map((key) => (
                <Badge key={key} variant="warning" size="sm">
                  {key}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
