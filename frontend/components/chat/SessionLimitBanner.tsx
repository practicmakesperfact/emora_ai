// ============================================================
// Emora AI — Session Limit Banner
// Shown in the chat when the user approaches or reaches the
// session message/duration limit (req.md §Deceptive Empathy).
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MessageSquare, Plus, Info } from 'lucide-react';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';
import type { SessionStatus } from '@/types';

interface SessionLimitBannerProps {
  status: SessionStatus;
  /** Pass the hard-limit message text from the backend 429 response. */
  limitErrorMessage?: string | null;
}

export function SessionLimitBanner({
  status,
  limitErrorMessage,
}: SessionLimitBannerProps) {
  const isHardBlocked =
    status.is_limit_reached || Boolean(limitErrorMessage);

  // ── Warn when ≤ 10 messages OR ≤ 10 minutes remain (not yet blocked) ──
  const isNearMsgLimit =
    !status.is_message_limit_reached && status.messages_remaining <= 10;
  const isNearTimeLimit =
    !status.is_duration_limit_reached && status.minutes_remaining <= 10;
  const isNearLimit = isNearMsgLimit || isNearTimeLimit;

  // Don't render anything if well within limits
  if (!isHardBlocked && !isNearLimit) return null;

  if (isHardBlocked) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          'rounded-2xl border p-4 mx-4 mb-3',
          'bg-amber-50 border-amber-200'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-xl bg-amber-100 shrink-0">
            <Clock className="w-4 h-4 text-amber-600" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-amber-800">
              Session limit reached
            </h3>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              {limitErrorMessage ||
                (status.is_message_limit_reached
                  ? `You've sent ${status.max_messages} messages in this session. Regular breaks support healthy wellbeing.`
                  : `This session has been active for ${status.max_duration_minutes} minutes. Time for a healthy break.`)}
            </p>
            <p className="text-xs text-amber-600 mt-1.5 leading-relaxed">
              Starting a new conversation lets you continue with a fresh context.
              Your previous conversations are always saved.
            </p>
            <Link
              href={ROUTES.CHAT}
              className={cn(
                'mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5',
                'rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
              )}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Start a new conversation
            </Link>
          </div>
        </div>

        {/* Progress details */}
        <div className="mt-3 pt-3 border-t border-amber-200 grid grid-cols-2 gap-3">
          <SessionStat
            icon={<MessageSquare className="w-3 h-3" />}
            label="Messages sent"
            value={`${status.user_message_count} / ${status.max_messages}`}
            color="text-amber-700"
          />
          <SessionStat
            icon={<Clock className="w-3 h-3" />}
            label="Session time"
            value={`${status.session_age_minutes} / ${status.max_duration_minutes} min`}
            color="text-amber-700"
          />
        </div>
      </div>
    );
  }

  // ── Soft warning (approaching limit) ──────────────────────────────────────
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-2xl border px-4 py-3 mx-4 mb-2',
        'bg-indigo-50 border-indigo-100'
      )}
    >
      <div className="flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-indigo-700 leading-relaxed">
            {isNearMsgLimit && (
              <>
                <strong>{status.messages_remaining}</strong> message
                {status.messages_remaining !== 1 ? 's' : ''} remaining in this
                session.{' '}
              </>
            )}
            {isNearTimeLimit && (
              <>
                <strong>{status.minutes_remaining}</strong> minute
                {status.minutes_remaining !== 1 ? 's' : ''} remaining.{' '}
              </>
            )}
            Taking breaks is a healthy habit.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function SessionStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', color)}>
      <span aria-hidden>{icon}</span>
      <div>
        <p className="text-xs font-semibold">{value}</p>
        <p className="text-xs opacity-75">{label}</p>
      </div>
    </div>
  );
}
