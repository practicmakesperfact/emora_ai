// ============================================================
// Emora AI — Dashboard Page
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Heart, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { chatApi } from '@/lib/api/chat.api';
import { moodApi } from '@/lib/api/mood.api';
import { journalApi } from '@/lib/api/journal.api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Feedback';
import { formatRelativeTime, getMoodEmoji, getMoodLabel } from '@/utils';
import { ROUTES } from '@/constants';

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
  const latestMood = moodHistory?.[moodHistory.length - 1];

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
            <Heart className="w-6 h-6 mb-3 text-rose-500" aria-hidden />
            <h2 className="font-semibold text-sm text-slate-800 mb-1">Log Your Mood</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track how you&apos;re feeling today
            </p>
          </div>
        </Link>

        <Link href={ROUTES.JOURNAL} className="group">
          <div className="rounded-2xl bg-white border border-slate-100 p-5 hover:shadow-sm transition-shadow h-full">
            <BookOpen className="w-6 h-6 mb-3 text-amber-500" aria-hidden />
            <h2 className="font-semibold text-sm text-slate-800 mb-1">Write in Journal</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Reflect on your thoughts and feelings
            </p>
          </div>
        </Link>
      </div>

      {/* Latest mood */}
      {!moodLoading && latestMood && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Most recent mood</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>{getMoodEmoji(latestMood.score)}</span>
                <div>
                  <p className="font-semibold text-slate-800">
                    {getMoodLabel(latestMood.score)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Score {latestMood.score}/10 ·{' '}
                    {formatRelativeTime(latestMood.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <Link href={ROUTES.MOOD}>
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3 h-3" />}>
                View trends
              </Button>
            </Link>
          </div>
        </Card>
      )}
      {moodLoading && <Skeleton className="h-20 rounded-2xl" />}

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
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-indigo-500" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">
                      {conv.title}
                    </p>
                    {conv.summary && (
                      <p className="text-xs text-slate-400 truncate">{conv.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" aria-hidden />
                    <span className="text-xs">
                      {formatRelativeTime(conv.updated_at)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
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
