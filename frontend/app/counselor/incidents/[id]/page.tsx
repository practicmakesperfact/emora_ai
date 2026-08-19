// ============================================================
// Emora AI — Counselor Incident Detail Page
// Allows reviewing flagged conversation messages and resolving incidents
// ============================================================

'use client';

import React, { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Clock, ShieldCheck, MessageSquare, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { crisisApi } from '@/lib/api/crisis.api';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingPage, ErrorMessage, InlineError } from '@/components/common/Feedback';
import { incidentResolveSchema, type IncidentResolveFormData } from '@/schemas';
import { getRiskLevelBg, formatDateTime, getErrorMessage } from '@/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/constants';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CounselorIncidentDetailPage({ params }: Props) {
  const { id: incidentIdStr } = use(params);
  const incidentId = parseInt(incidentIdStr, 10);
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  // Load incident details
  const { data: incident, isLoading: incLoading, error: incError, refetch: refetchInc } = useQuery({
    queryKey: ['incident', incidentId],
    queryFn: () => crisisApi.getIncident(incidentId),
    enabled: !isNaN(incidentId),
  });

  // Load associated conversation messages if available
  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', incident?.conversation_id],
    queryFn: () => chatApi.getMessages(incident!.conversation_id!),
    enabled: !!incident?.conversation_id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncidentResolveFormData>({
    resolver: zodResolver(incidentResolveSchema),
    defaultValues: {
      counselor_notes: incident?.counselor_notes || '',
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (data: IncidentResolveFormData) =>
      crisisApi.resolveIncident(incidentId, { counselor_notes: data.counselor_notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents-list'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  if (isNaN(incidentId)) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Invalid incident ID.
      </div>
    );
  }

  if (incLoading) return <LoadingPage />;
  if (incError) {
    return (
      <ErrorMessage
        message={getApiErrorMessage(incError)}
        onRetry={() => refetchInc()}
      />
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="w-10 h-10 text-slate-300 mb-2" aria-hidden />
        <p className="text-slate-500 text-sm">Incident record not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.COUNSELOR_INCIDENTS} aria-label="Back to incidents list">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incident Details</h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden />
            Flagged on {formatDateTime(incident.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flagged Message and Conversation History */}
        <div className="md:col-span-2 space-y-4">
          {/* Flagged message card */}
          <Card>
            <h2 className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" aria-hidden />
              Flagged message content
            </h2>
            <p className="text-sm text-slate-800 italic bg-rose-50/50 p-4 border border-rose-100 rounded-xl leading-relaxed font-medium">
              &ldquo;{incident.message_content}&rdquo;
            </p>
          </Card>

          {/* Conversation history details */}
          <Card>
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" aria-hidden />
              Context Conversation
            </h2>
            {msgLoading ? (
              <p className="text-xs text-slate-400">Loading conversation history…</p>
            ) : !messages || messages.length === 0 ? (
              <p className="text-xs text-slate-400">No context messages available.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                      {msg.role === 'user' ? (
                        <>
                          <User className="w-3 h-3 text-slate-400" aria-hidden />
                          User
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3 text-indigo-500" aria-hidden />
                          AI Assistant
                        </>
                      )}
                    </p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Resolution details sidebar */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Incident Status
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Risk Level</span>
                <Badge className={getRiskLevelBg(incident.risk_level)}>
                  {incident.risk_level.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Escalation status</span>
                {incident.resolved ? (
                  <Badge variant="success">RESOLVED</Badge>
                ) : (
                  <Badge variant="warning">ACTIVE</Badge>
                )}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Action taken</span>
                <span className="font-medium text-slate-700 text-right">
                  {incident.action_taken}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">User ID</span>
                <span className="font-medium text-slate-700">{incident.user_id}</span>
              </div>
            </div>
          </Card>

          {/* Resolve Action form */}
          <Card>
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Resolution notes
            </h2>

            {incident.resolved ? (
              <div className="space-y-2 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Resolved and closed. Counselor summary:
                </p>
                <p className="text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl italic">
                  {incident.counselor_notes || 'No counselor notes provided.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => resolveMutation.mutate(d))} noValidate>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Enter support actions taken, counselor summary notes, or resolution outcomes…"
                    rows={4}
                    required
                    error={errors.counselor_notes?.message}
                    {...register('counselor_notes')}
                  />

                  {apiError && <InlineError message={apiError} />}

                  <Button
                    type="submit"
                    className="w-full"
                    variant="primary"
                    isLoading={resolveMutation.isPending || isSubmitting}
                  >
                    Resolve & Close
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
