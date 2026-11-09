// ============================================================
// Emora AI — AI Transparency Disclosure Card
// Shown at the top of every new conversation before the first
// message is sent. Satisfies req.md §Transparency & Limits:
// "Mandatory Transparency Disclosures (e.g., 'I am an AI,
// not a human')."
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { ROUTES } from '@/constants';

const DISCLOSURES = [
  {
    icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden />,
    text: 'I am Emora, an AI assistant — not a licensed therapist or medical professional.',
  },
  {
    icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />,
    text: 'I cannot diagnose conditions or prescribe treatments. For serious concerns, please consult a qualified professional.',
  },
  {
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" aria-hidden />,
    text: 'Sessions are limited to support healthy use. Regular breaks are encouraged.',
  },
];

export function AIDisclosureCard() {
  return (
    <div
      role="note"
      aria-label="Important: AI transparency notice"
      className="mx-auto w-full max-w-lg rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 mb-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Before we begin</p>
          <p className="text-xs text-indigo-500">Please read this important notice</p>
        </div>
      </div>

      {/* Disclosure list */}
      <ul className="space-y-2.5">
        {DISCLOSURES.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">{item.icon}</span>
            <p className="text-xs text-indigo-800 leading-relaxed">{item.text}</p>
          </li>
        ))}
      </ul>

      {/* Links */}
      <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-3 flex-wrap">
        <Link
          href={ROUTES.SUPPORT}
          className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <ExternalLink className="w-3 h-3" aria-hidden />
          Crisis support resources
        </Link>
        <Link
          href={ROUTES.PRIVACY}
          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
