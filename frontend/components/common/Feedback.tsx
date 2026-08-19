// ============================================================
// Emora AI — Skeleton, Spinner, EmptyState, ErrorMessage
// ============================================================

import React from 'react';
import { cn } from '@/utils';
import { AlertCircle, Inbox } from 'lucide-react';

// ─── Skeleton ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-100',
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500',
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      role="status"
    >
      <div className="mb-4 text-slate-300">
        {icon || <Inbox className="w-12 h-12" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-slate-600 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Error Message ────────────────────────────────────────────────────────

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <AlertCircle className="w-10 h-10 text-rose-400 mb-3" aria-hidden />
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-indigo-600 hover:text-indigo-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Inline Error ─────────────────────────────────────────────────────────

export function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-700"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
