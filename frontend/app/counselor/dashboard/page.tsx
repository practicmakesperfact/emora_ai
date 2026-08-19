// ============================================================
// Emora AI — Counselor Dashboard Page
// Overview of flagged safety incidents
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import { crisisApi } from '@/lib/api/crisis.api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingPage, ErrorMessage, Skeleton } from '@/components/common/Feedback';
import { getRiskLevelBg, getRiskLevelColor, formatRelativeTime, truncate } from '@/utils';
import { ROUTES } from '@/constants';

export default function CounselorDashboardPage() {
  const { data: incidents, isLoading, error, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => crisisApi.listIncidents(0, 10),
  });

  if (isLoading) return <LoadingPage />;
  if (error) {
    return (
      <ErrorMessage
        message="We couldn't load the counselor incident records."
        onRetry={() => refetch()}
      />
    );
  }

  const activeIncidents = incidents?.filter((i) => !i.resolved) || [];
  const resolvedIncidents = incidents?.filter((i) => i.resolved) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Counselor Portal</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review and resolve escalated safety incidents flagged by the AI.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{activeIncidents.length}</p>
            <p className="text-xs text-slate-400">Active Incidents</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{resolvedIncidents.length}</p>
            <p className="text-xs text-slate-400">Resolved Incidents</p>
          </div>
        </Card>
      </div>

      {/* Incidents Table list */}
      <section aria-labelledby="incidents-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="incidents-heading" className="font-semibold text-slate-800">
            Recent Alerts
          </h2>
          <Link href={ROUTES.COUNSELOR_INCIDENTS}>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All
            </Button>
          </Link>
        </div>

        {activeIncidents.length === 0 ? (
          <Card className="text-center py-8">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" aria-hidden />
            <p className="text-slate-500 text-sm">All clear. No active incidents to resolve.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeIncidents.slice(0, 5).map((inc) => (
              <Link key={inc.id} href={`/counselor/incidents/${inc.id}`}>
                <Card hover className="flex items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={getRiskLevelBg(inc.risk_level)}>
                        {inc.risk_level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden />
                        {formatRelativeTime(inc.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate font-medium">
                      &ldquo;{truncate(inc.message_content, 80)}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      User ID #{inc.user_id} · Action: {inc.action_taken}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" aria-hidden />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
