// ============================================================
// Emora AI — Journal Detail Page (/journal/[journalId])
// Displays the full entry alongside AI insights
// ============================================================

'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Smile, Key, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { journalApi } from '@/lib/api/journal.api';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingPage, ErrorMessage } from '@/components/common/Feedback';
import { formatDateTime } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/constants';

interface Props {
  params: Promise<{ journalId: string }>;
}

export default function JournalDetailPage({ params }: Props) {
  const { journalId: entryIdStr } = use(params);
  const entryId = parseInt(entryIdStr, 10);

  const { data: entry, isLoading, error, refetch } = useQuery({
    queryKey: ['journal', entryId],
    queryFn: () => journalApi.getEntry(entryId),
    enabled: !isNaN(entryId),
  });

  if (isNaN(entryId)) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Invalid entry.
      </div>
    );
  }

  if (isLoading) return <LoadingPage />;
  if (error) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(error)}
        onRetry={() => refetch()}
      />
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-10 h-10 text-slate-300 mb-2" aria-hidden />
        <p className="text-slate-500 text-sm">Entry not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.JOURNAL} aria-label="Back to journal list">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Journal Entry</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
          </div>
        </div>
      </div>

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
    </div>
  );
}
