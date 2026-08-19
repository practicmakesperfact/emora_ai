// ============================================================
// Emora AI — Mood Tracking Page (/mood)
// ============================================================

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { moodApi } from '@/lib/api/mood.api';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState, ErrorMessage, LoadingPage, InlineError, Skeleton } from '@/components/common/Feedback';
import { Modal } from '@/components/common/Modal';
import { moodSchema, type MoodFormData } from '@/schemas';
import {
  getMoodEmoji,
  getMoodLabel,
  getMoodColor,
  formatDateTime,
  formatDate,
  getErrorMessage,
} from '@/utils';
import { COMMON_EMOTIONS } from '@/constants';

export default function MoodPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [showLogger, setShowLogger] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: history, isLoading: histLoading, error: histError, refetch } = useQuery({
    queryKey: ['mood-history', period],
    queryFn: () => moodApi.getMoodHistory(period),
  });

  const { data: trends, isLoading: trendLoading } = useQuery({
    queryKey: ['mood-trends', period === 'all' ? 'weekly' : period],
    queryFn: () => moodApi.getMoodTrends(period === 'all' ? 'weekly' : period),
    enabled: period !== 'all',
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema),
    defaultValues: { score: 5, emotions: [] },
  });

  const selectedScore = watch('score');
  const selectedEmotions = watch('emotions') || [];

  const logMutation = useMutation({
    mutationFn: (data: MoodFormData) =>
      moodApi.logMood({
        score: data.score,
        mood_notes: data.mood_notes || undefined,
        emotions: data.emotions?.length ? data.emotions : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      queryClient.invalidateQueries({ queryKey: ['mood-trends'] });
      setShowLogger(false);
      reset();
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => moodApi.deleteMoodLog(id),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      queryClient.invalidateQueries({ queryKey: ['mood-trends'] });
    },
  });

  function toggleEmotion(emotion: string) {
    const cur = selectedEmotions;
    if (cur.includes(emotion)) {
      setValue('emotions', cur.filter((e) => e !== emotion));
    } else {
      setValue('emotions', [...cur, emotion]);
    }
  }

  const chartData = trends?.daily_averages.map((d) => ({
    date: d.date.slice(5), // MM-DD
    score: parseFloat(d.average_score.toFixed(1)),
  }));

  if (histLoading) return <LoadingPage />;
  if (histError) {
    return (
      <ErrorMessage
        message="We couldn't load your mood history."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mood Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track how you feel each day — no pressure, no judgment.
          </p>
        </div>
        <Button
          onClick={() => setShowLogger(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Log Mood
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2" role="group" aria-label="Filter mood history period">
        {(['weekly', 'monthly', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
            aria-pressed={period === p}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Trend Chart */}
      {period !== 'all' && (
        <Card>
          <CardHeader
            title="Mood Trend"
            subtitle={`Average daily score over the past ${period === 'weekly' ? '7' : '30'} days`}
            icon={<Heart className="w-4 h-4" />}
          />
          {trendLoading ? (
            <Skeleton className="h-48" />
          ) : !chartData || chartData.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No mood records yet. Log your first mood to see trends.
            </div>
          ) : (
            <>
              {/* Summary stats */}
              {trends && (
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-indigo-600">
                      {trends.summary.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Average</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-slate-700">
                      {trends.summary.total_logs}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Total logs</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl">
                      {getMoodEmoji(Math.round(trends.summary.average_score))}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Overall</p>
                  </div>
                </div>
              )}

              <div aria-label="Mood trend chart" role="img">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[1, 10]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [
                        `${value} — ${getMoodLabel(Math.round(Number(value)))}`,
                        'Score',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Mood History */}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="font-semibold text-slate-800 mb-3">
          History
        </h2>

        {!history || history.length === 0 ? (
          <EmptyState
            title="No mood records yet"
            description="Log your first mood to start tracking how you feel over time."
            icon={<Heart className="w-12 h-12" />}
            action={
              <Button onClick={() => setShowLogger(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Log Your Mood
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3" aria-label="Mood history list">
            {history.map((log) => (
              <li key={log.id}>
                <div className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-sm transition-shadow">
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="text-2xl" aria-hidden>
                      {getMoodEmoji(log.score)}
                    </span>
                    <span
                      className={`text-sm font-bold mt-0.5 ${getMoodColor(log.score)}`}
                    >
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
                          <Badge key={e} variant="info" size="sm">{e}</Badge>
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
                    onClick={() => setDeleteId(log.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
                    aria-label={`Delete mood log from ${formatDate(log.created_at)}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Log Mood Modal */}
      <Modal
        isOpen={showLogger}
        onClose={() => { setShowLogger(false); reset(); setApiError(null); }}
        title="How are you feeling?"
        size="md"
      >
        <form onSubmit={handleSubmit((d) => logMutation.mutate(d))} noValidate>
          <div className="space-y-5">
            {/* Score picker */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Rate your mood (1 = very difficult, 10 = excellent)
              </p>
              <Controller
                name="score"
                control={control}
                render={({ field }) => (
                  <div>
                    <div className="flex gap-1 flex-wrap" role="radiogroup" aria-label="Mood score">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(n)}
                          className={`flex-1 min-w-[32px] py-2 rounded-xl text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                            field.value === n
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                          }`}
                          role="radio"
                          aria-checked={field.value === n}
                          aria-label={`Score ${n}: ${getMoodLabel(n)}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-sm mt-2">
                      <span className="text-xl" aria-hidden>
                        {getMoodEmoji(field.value)}
                      </span>{' '}
                      <span className="text-slate-600">{getMoodLabel(field.value)}</span>
                    </p>
                    {errors.score && (
                      <p className="text-xs text-rose-600 mt-1">{errors.score.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Emotions */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                How would you describe your emotions? (optional)
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select emotions">
                {COMMON_EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      selectedEmotions.includes(emotion)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                    aria-pressed={selectedEmotions.includes(emotion)}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              label="Notes (optional)"
              placeholder="Anything you'd like to add about your day or how you're feeling…"
              rows={3}
              {...register('mood_notes')}
              error={errors.mood_notes?.message}
            />

            {apiError && <InlineError message={apiError} />}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowLogger(false); reset(); }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={logMutation.isPending || isSubmitting}>
                Save Mood
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete mood log?"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          This mood entry will be permanently deleted.
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
