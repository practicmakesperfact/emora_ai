// ============================================================
// Emora AI — Journal Page (/journal)
// Guided Journaling & AI summary analysis
// ============================================================

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Plus, Trash2, Calendar, Smile, Key } from 'lucide-react';
import Link from 'next/link';
import { journalApi } from '@/lib/api/journal.api';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState, ErrorMessage, LoadingPage, InlineError } from '@/components/common/Feedback';
import { Modal } from '@/components/common/Modal';
import { journalSchema, type JournalFormData } from '@/schemas';
import { formatDateTime, getErrorMessage } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/constants';

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: entries, isLoading, error, refetch } = useQuery({
    queryKey: ['journal-history'],
    queryFn: () => journalApi.getHistory(0, 100),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: JournalFormData) => journalApi.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-history'] });
      setShowEditor(false);
      reset();
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => journalApi.deleteEntry(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['journal-history'] });
    },
  });

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reflect on your day. Receive AI summary and emotional insights.
          </p>
        </div>
        <Button
          onClick={() => setShowEditor(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Write Entry
        </Button>
      </div>

      {/* Entry List */}
      <section aria-labelledby="journal-list-heading">
        <h2 id="journal-list-heading" className="sr-only">Journal Entries</h2>

        {!entries || entries.length === 0 ? (
          <EmptyState
            title="No journal entries yet"
            description="Write your first entry to capture your thoughts and feelings."
            icon={<BookOpen className="w-12 h-12" />}
            action={
              <Button onClick={() => setShowEditor(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Write Your First Entry
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Journal list">
            {entries.map((entry) => (
              <li key={entry.id} className="h-full">
                <Card hover className="flex flex-col justify-between h-full group relative">
                  <div>
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" aria-hidden />
                      <time dateTime={entry.created_at}>
                        {formatDateTime(entry.created_at)}
                      </time>
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
                        onClick={() => setDeleteId(entry.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        aria-label={`Delete journal entry from ${formatDateTime(entry.created_at)}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => { setShowEditor(false); reset(); setApiError(null); }}
        title="New Journal Entry"
        size="lg"
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} noValidate>
          <div className="space-y-4">
            <Textarea
              label="Reflect on your thoughts, actions, and feelings"
              placeholder="What happened today? How did you react? Writing helps organize emotions…"
              rows={8}
              required
              error={errors.content?.message}
              {...register('content')}
            />

            {apiError && <InlineError message={apiError} />}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowEditor(false); reset(); }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending || isSubmitting}>
                Save Entry & Analyze
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete journal entry?"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          This entry and all its AI-generated analysis will be permanently deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
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
      </Modal>
    </div>
  );
}
