/**
 * HITLAlertToast — Real-time crisis incident notification
 *
 * Renders a stack of toast notifications in the top-right corner of the
 * screen whenever the AI flags a High or Critical crisis event. Each
 * toast auto-dismisses after 15 seconds and can be manually closed.
 *
 * Design: calm and professional — no alarming sirens or hard reds.
 * Colors follow the existing Emora risk-level palette:
 *   High     → amber
 *   Critical → rose
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import type { HITLAlert } from '@/hooks/useHITLSocket';

// ── Types ─────────────────────────────────────────────────────────────────

interface ToastItemProps {
  alert: HITLAlert;
  onDismiss: (id: string) => void;
}

interface HITLAlertToastProps {
  alerts: HITLAlert[];
  onDismiss: (id: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 15_000;

function getRiskStyles(riskLevel: string): {
  badge: string;
  border: string;
  icon: string;
} {
  if (riskLevel === 'Critical') {
    return {
      badge: 'bg-rose-100 text-rose-700 border border-rose-200',
      border: 'border-l-4 border-l-rose-400',
      icon: 'text-rose-500',
    };
  }
  // High (default)
  return {
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    border: 'border-l-4 border-l-amber-400',
    icon: 'text-amber-500',
  };
}

// ── Single Toast Item ─────────────────────────────────────────────────────

function ToastItem({ alert, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const styles = getRiskStyles(alert.risk_level);

  // Animate in
  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(show);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(alert.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'relative w-80 bg-white rounded-xl shadow-lg overflow-hidden',
        styles.border,
        'transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
      ].join(' ')}
    >
      {/* Auto-dismiss progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-slate-200 w-full"
        aria-hidden
      >
        <div
          className="h-full bg-slate-400 origin-left"
          style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
        />
      </div>

      <div className="p-4 pr-10">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 ${styles.icon}`}
            aria-hidden
          />
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${styles.badge}`}
          >
            {alert.risk_level} Risk
          </span>
          <span className="text-xs text-slate-400 ml-auto">
            User #{alert.user_id}
          </span>
        </div>

        {/* Message preview */}
        <p className="text-sm text-slate-700 leading-snug line-clamp-2 mb-2">
          &ldquo;{alert.message_preview}&rdquo;
        </p>

        {/* Action link */}
        <Link
          href={`/counselor/incidents/${alert.incident_id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          onClick={() => onDismiss(alert.id)}
        >
          <ExternalLink className="w-3 h-3" aria-hidden />
          Review Incident #{alert.incident_id}
        </Link>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(alert.id)}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────

/**
 * Renders up to 5 stacked toasts in the top-right corner.
 * Place this once at the top of the counselor dashboard page.
 */
export function HITLAlertToast({ alerts, onDismiss }: HITLAlertToastProps) {
  const visible = alerts.slice(0, 5);
  if (visible.length === 0) return null;

  return (
    <>
      {/* CSS keyframe for shrink animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        aria-label="Crisis alert notifications"
      >
        {visible.map((alert) => (
          <ToastItem key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
}
