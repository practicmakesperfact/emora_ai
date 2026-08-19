// ============================================================
// Emora AI — Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOOD_LABELS, MOOD_EMOJIS } from '@/constants';

// ─── Tailwind Class Merging ───────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date Formatting ──────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ─── Mood Helpers ─────────────────────────────────────────────────────────

export function getMoodLabel(score: number): string {
  return MOOD_LABELS[score] || 'Unknown';
}

export function getMoodEmoji(score: number): string {
  return MOOD_EMOJIS[score] || '😐';
}

export function getMoodColor(score: number): string {
  if (score <= 3) return 'text-rose-500';
  if (score <= 5) return 'text-amber-500';
  if (score <= 7) return 'text-indigo-500';
  return 'text-emerald-500';
}

export function getMoodBgColor(score: number): string {
  if (score <= 3) return 'bg-rose-50 border-rose-100';
  if (score <= 5) return 'bg-amber-50 border-amber-100';
  if (score <= 7) return 'bg-indigo-50 border-indigo-100';
  return 'bg-emerald-50 border-emerald-100';
}

// ─── Crisis Helpers ───────────────────────────────────────────────────────

export function getRiskLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low': return 'text-emerald-600';
    case 'medium': return 'text-amber-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-rose-600';
    default: return 'text-gray-600';
  }
}

export function getRiskLevelBg(level: string): string {
  switch (level.toLowerCase()) {
    case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

// ─── File Size ────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── String Helpers ───────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Error Helpers ────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}
