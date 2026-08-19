// ============================================================
// Emora AI — Counselor Incidents List Page
// Lists all flagged safety incidents
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { crisisApi } from '@/lib/api/crisis.api';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState, ErrorMessage, LoadingPage } from '@/components/common/Feedback';
import { getRiskLevelBg, formatRelativeTime, truncate } from '@/utils';

export default function CounselorIncidentsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const { data: incidents, isLoading, error, refetch } = useQuery({
    queryKey: ['incidents-list'],
    queryFn: () => crisisApi.listIncidents(0, 500),
  });

  if (isLoading) return <LoadingPage />;
  if (error) {
    return (
      <ErrorMessage
        message="We couldn't load the escalated incidents list."
        onRetry={() => refetch()}
      />
    );
  }

  const filtered = incidents?.filter((inc) => {
    if (filter === 'active') return !inc.resolved;
    if (filter === 'resolved') return inc.resolved;
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Escalated Incidents</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Comprehensive log of safety flags and resolution statuses.
        </p>
      </div>

      {/* Filter Options */}
      <div className="flex gap-2" role="group" aria-label="Filter incidents status">
        {(['all', 'active', 'resolved'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              filter === opt
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
            aria-pressed={filter === opt}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <section aria-labelledby="escalation-heading">
        <h2 id="escalation-heading" className="sr-only">Incidents log</h2>

        {!filtered || filtered.length === 0 ? (
          <EmptyState
            title="No incidents found"
            description="No incidents matched your selected filter."
            icon={<ShieldCheck className="w-12 h-12 text-slate-300" />}
          />
        ) : (
          <ul className="space-y-3" aria-label="Incidents list">
            {filtered.map((inc) => (
              <li key={inc.id}>
                <Link href={`/counselor/incidents/${inc.id}`}>
                  <Card hover className="flex items-center gap-4 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={getRiskLevelBg(inc.risk_level)}>
                          {inc.risk_level.toUpperCase()}
                        </Badge>
                        {inc.resolved ? (
                          <Badge variant="success">RESOLVED</Badge>
                        ) : (
                          <Badge variant="warning">ACTIVE</Badge>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden />
                          {formatRelativeTime(inc.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium truncate">
                        &ldquo;{truncate(inc.message_content, 120)}&rdquo;
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        User ID #{inc.user_id} · Actions taken: {inc.action_taken}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" aria-hidden />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
