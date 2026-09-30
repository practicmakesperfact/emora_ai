// ============================================================
// Emora AI — MoodSummaryWidget Component
// Dashboard widget showing 7-day mood trend summary
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Feedback';
import { Button } from '@/components/common/Button';
import { getMoodEmoji, getMoodColor } from '@/utils';
import { ROUTES } from '@/constants';
import type { MoodTrendsResponse } from '@/types';

interface MoodSummaryWidgetProps {
  trends?: MoodTrendsResponse;
  isLoading: boolean;
}

export function MoodSummaryWidget({ trends, isLoading }: MoodSummaryWidgetProps) {
  const avg = trends?.summary.average_score;
  const count = trends?.summary.total_logs;
  const hasData = trends && count && count > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Weekly Mood"
        subtitle="Your recent feelings"
        icon={<Heart className="w-4 h-4 text-rose-500" />}
      />

      <div className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-24 h-4" />
          </div>
        ) : hasData ? (
          <div className="flex flex-col items-center text-center py-2">
            <span className="text-5xl mb-2" aria-hidden>
              {getMoodEmoji(Math.round(avg!))}
            </span>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className={`text-3xl font-bold ${getMoodColor(Math.round(avg!))}`}>
                {avg?.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-400">/ 10</span>
            </div>
            <p className="text-xs text-slate-500">
              Average across {count} log{count !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-400 mb-3">No mood logs this week.</p>
            <Link href={ROUTES.MOOD}>
              <Button size="sm" variant="outline">
                Track Mood
              </Button>
            </Link>
          </div>
        )}
      </div>

      {hasData && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <Link href={ROUTES.MOOD}>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Details
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
