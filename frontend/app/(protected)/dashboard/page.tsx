// ============================================================
// Emora AI — Dashboard Page
// Step 9: Today's mood card, streak counter, suggested exercise,
//         titled conversations, gentle mood insight wording.
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Heart, BookOpen, ArrowRight, Clock, Wind } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { chatApi } from '@/lib/api/chat.api';
import { moodApi } from '@/lib/api/mood.api';
import { journalApi } from '@/lib/api/journal.api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Feedback';
import { formatRelativeTime, getMoodEmoji, getMoodLabel } from '@/utils';
import { ROUTES } from '@/constants';
import type { MoodLog } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if a mood log was created today (local date) */
function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Compute streak: consecutive days with at least one mood log (most-recent first) */
function computeStreak(logs: MoodLog[]): number {
  if (!logs || logs.length === 0) return 0;
  const days = new Set(
    logs.map((l) => {
      const d = new Date(l.created_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  const cursor = new Date();
  // Start counting from today; if today has no log yet, start from yesterday
  if (!isToday(logs[0]?.created_at)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Gentle insight string from recent average (avoids judgment language) */
function getMoodInsight(logs: MoodLog[]): string | null {
  if (!logs || logs.length < 3) return null;
  const recent = logs.slice(0, 7);
  const avg = recent.reduce((s, l) => s + l.score, 0) / recent.length;
  if (avg <= 4) return 'Your mood has been lower this week — it\'s okay to take things one step at a time.';
  if (avg <= 6) return 'Your mood has been mixed this week — small moments of calm can help.';
  return 'Your mood has been steady this week — keep checking in.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations({ limit: 3 }),
  });

  const { data: moodHistory, isLoading: moodLoading } = useQuery({
    queryKey: ['mood-history', 'weekly'],
    queryFn: () => moodApi.getMoodHistory('weekly'),
  });

  const { data: journals, isLoading: journalLoading } = useQuery({
    queryKey: ['journal-history'],
    queryFn: () => journalApi.getHistory(0, 3),
  });

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Sort mood history newest first
  const sortedMoods = moodHistory
    ? [...moodHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const todayMood = sortedMoods.find((l) => isToday(l.created_at)) ?? null;
  const streak = computeStreak(sortedMoods);
  const insight = getMoodInsight(sortedMoods);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {firstName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          How are you feeling today? I&apos;m here whenever you&apos;re ready to talk.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={ROUTES.CHAT} className="group">
          <div className="rounded-2xl bg-indigo-600 text-white p-5 hover:bg-indigo-700 transition-colors h-full">
            <MessageCircle className="w-6 h-6 mb-3 opacity-90" aria-hidden />
            <h2 className="font-semibold text-sm mb-1">Start Conversation</h2>
            <p className="text-xs opacity-80 leading-relaxed">
              Talk to your AI support assistant
            </p>
          </div>
        </Link>

        <Link href={ROUTES.MOOD} className="group">
          <div className="rounded-2xl bg-white border border-slate-100 p-5 hover:shadow-sm transition-shadow h-full">
            <Heart className="w-6 h-6 mb-3 text-rose-400" aria-hidden />
            <h2 className="font-semibold text-sm text-slate-800 mb-1">Log Your Mood</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track how you&apos;re feeling today
            </p>
          </div>
        </Link>

        <Link href={ROUTES.EXERCISE} className="group">
          <div className="rounded-2xl bg-white border border-slate-100 p-5 hover:shadow-sm transition-shadow h-full">
            <Wind className="w-6 h-6 mb-3 text-teal-500" aria-hidden />
            <h2 className="font-semibold text-sm text-slate-800 mb-1">Breathing Exercise</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              4-4-6 guided calm — 2 minutes
            </p>
          </div>
        </Link>
      </div>

      {/* Today's mood + streak card */}
      {moodLoading && <Skeleton className="h-24 rounded-2xl" />}
      {!moodLoading && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            {/* Left: Today's mood or prompt */}
            <div>
              {todayMood ? (
                <>
                  <p className="text-xs text-slate-400 mb-1">Today&apos;s mood</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>{getMoodEmoji(todayMood.score)}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{getMoodLabel(todayMood.score)}</p>
                      <p className="text-xs text-slate-400">Score {todayMood.score}/10</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-1">Mood today</p>
                  <p className="text-sm font-medium text-slate-600">
                    You haven&apos;t logged your mood yet today.
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Takes 10 seconds.</p>
                </>
              )}
            </div>

            {/* Right: streak + action */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {streak > 0 && (
                <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  <span className="text-sm" aria-hidden>🔥</span>
                  <span className="text-xs font-semibold">{streak} day streak</span>
                </div>
              )}
              <Link href={ROUTES.MOOD}>
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                  {todayMood ? 'View trends' : 'Log mood'}
                </Button>
              </Link>
            </div>
          </div>

          {/* Gentle insight (only if 3+ logs) */}
          {insight && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
              💬 {insight}
            </p>
          )}
        </Card>
      )}

      {/* Breathing exercise suggestion */}
      <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
          <Wind className="w-5 h-5 text-teal-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-800">Try a breathing exercise</p>
          <p className="text-xs text-teal-600 mt-0.5">
            A 4-4-6 breathing pattern can help reduce anxiety in just 2 minutes.
          </p>
        </div>
        <Link href={ROUTES.EXERCISE} className="shrink-0">
          <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="w-3 h-3" />}>
            Start
          </Button>
        </Link>
      </div>

      {/* Recent conversations */}
      <section aria-labelledby="conversations-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="conversations-heading" className="font-semibold text-slate-800">
            Recent Conversations
          </h2>
          <Link href={ROUTES.CHAT}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
              View all
            </Button>
          </Link>
        </div>

        {convLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        )}

        {!convLoading && conversations && conversations.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-slate-500 text-sm">No conversations yet.</p>
            <Link href={ROUTES.CHAT} className="mt-3 inline-block">
              <Button size="sm">Start your first conversation</Button>
            </Link>
          </Card>
        )}

        {!convLoading && conversations && conversations.length > 0 && (
          <div className="space-y-2">
            {conversations.map((conv) => {
              // Show real title or fallback gracefully
              const displayTitle =
                conv.title === 'New Conversation' || conv.title === ''
                  ? 'Untitled conversation'
                  : conv.title;
              return (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <Card hover className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-indigo-500" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{displayTitle}</p>
                      {conv.summary && (
                        <p className="text-xs text-slate-400 truncate">{conv.summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      <Clock className="w-3 h-3" aria-hidden />
                      <span className="text-xs">{formatRelativeTime(conv.updated_at)}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent journals */}
      <section aria-labelledby="journals-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="journals-heading" className="font-semibold text-slate-800">
            Recent Journal Entries
          </h2>
          <Link href={ROUTES.JOURNAL}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
              View all
            </Button>
          </Link>
        </div>

        {journalLoading && <Skeleton className="h-20 rounded-2xl" />}

        {!journalLoading && journals && journals.length === 0 && (
          <Card className="text-center py-6">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden />
            <p className="text-slate-500 text-sm">No journal entries yet.</p>
          </Card>
        )}

        {!journalLoading && journals && journals.length > 0 && (
          <div className="space-y-2">
            {journals.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`}>
                <Card hover>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-700 line-clamp-2 flex-1">
                      {entry.ai_summary || entry.content}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatRelativeTime(entry.created_at)}
                    </span>
                  </div>
                  {entry.emotions && entry.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.emotions.slice(0, 4).map((emotion) => (
                        <span
                          key={emotion}
                          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
