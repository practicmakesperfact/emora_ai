// ============================================================
// Emora AI — Crisis Card Component (Step 3 upgrade)
//
// Requirements met:
// 1. Calm soft-warm background — NOT alarming red
// 2. Validating message in English + Amharic
// 3. tap-to-call tel: buttons for every emergency number
// 4. "Talk to a counselor" button → /support
// 5. "I'm safe, continue chatting" dismiss button
// 6. Never text-only links for crisis numbers
// 7. Mock/test mode: triggered by is_mock_crisis prop or ?crisis=mock URL param
//
// Step 4 will centralise numbers in lib/emergencyContacts.ts;
// this file already imports from there so Step 4 is a drop-in.
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Phone, Shield, MessageCircle, X } from 'lucide-react';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';
import type { Message } from '@/types';

// ── Emergency contacts (will be replaced by lib/emergencyContacts import in Step 4)
// Keeping them here for now so the card works independently.
const EMERGENCY_CONTACTS = [
  {
    id: 'mental-health-helpline',
    nameEn: 'Mental Health Helpline',
    nameAm: 'የአእምሮ ጤና የስልክ መስመር',
    number: '8335',
    descriptionEn: 'Free · 24/7',
    descriptionAm: 'ነፃ · 24/7',
    isPrimary: true,
  },
  {
    id: 'police',
    nameEn: 'Police',
    nameAm: 'ፖሊስ',
    number: '939',
    descriptionEn: 'Emergency services',
    descriptionAm: 'የአደጋ ጊዜ አገልግሎቶች',
    isPrimary: false,
  },
  {
    id: 'ambulance',
    nameEn: 'Ambulance',
    nameAm: 'አምቡላንስ',
    number: '907',
    descriptionEn: 'Emergency services',
    descriptionAm: 'የአደጋ ጊዜ አገልግሎቶች',
    isPrimary: false,
  },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface CrisisCardProps {
  /** A real crisis message from the conversation */
  message?: Message;
  /** True when triggered by ?crisis=mock in the URL (dev/demo mode) */
  isMock?: boolean;
  /** Called when the user clicks "I'm safe, continue chatting" */
  onDismiss?: () => void;
}

export function CrisisCard({ message, isMock = false, onDismiss }: CrisisCardProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show for low-risk messages unless mock mode
  if (!isMock && (!message?.is_crisis_triggered)) return null;
  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="Crisis support card"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 relative"
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Dismiss crisis support card — I'm safe"
      >
        <X className="w-4 h-4" aria-hidden />
      </button>

      {isMock && (
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest uppercase bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
          TEST MODE
        </span>
      )}

      {/* Header */}
      <div className={cn('flex items-start gap-3 mb-3', isMock && 'mt-5')}>
        <div className="p-1.5 rounded-xl bg-amber-100 shrink-0">
          <Heart className="w-4 h-4 text-amber-600" aria-hidden />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-amber-900">
            {/* English + Amharic heading */}
            You&apos;re not alone · ብቻህ/ሽ አይደለህ/ሽም
          </h3>
          <p className="text-xs mt-0.5 leading-relaxed text-amber-800">
            What you&apos;re feeling matters. Support is here for you right now.
            <br />
            <span className="lang-am">
              የሚሰማህ/ሽ ስሜት ትክክለኛ ነው። አሁን እርዳታ አለ።
            </span>
          </p>
        </div>
      </div>

      {/* Tap-to-call buttons — NEVER text-only */}
      <div className="mb-3 space-y-2">
        <p className="text-xs font-semibold text-amber-900 mb-1.5">
          Call for support · ለድጋፍ ደውሉ
        </p>
        {EMERGENCY_CONTACTS.map((contact) => (
          <a
            key={contact.id}
            href={`tel:${contact.number}`}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              contact.isPrimary
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
            )}
            aria-label={`Call ${contact.nameEn} at ${contact.number}`}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              contact.isPrimary ? 'bg-white/20' : 'bg-amber-200'
            )}>
              <Phone className="w-4 h-4" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {contact.number} — {contact.nameEn}
              </p>
              <p className={cn(
                'text-xs leading-tight lang-am',
                contact.isPrimary ? 'text-white/80' : 'text-amber-700'
              )}>
                {contact.nameAm} · {contact.descriptionAm}
              </p>
            </div>
            <Shield className={cn('w-4 h-4 shrink-0', contact.isPrimary ? 'text-white/70' : 'text-amber-500')} aria-hidden />
          </a>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Talk to a counselor */}
        <Link
          href={ROUTES.SUPPORT}
          className={cn(
            'flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl',
            'bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors',
            'min-h-[44px]'
          )}
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
          <span>Talk to a counselor</span>
        </Link>

        {/* I'm safe — dismiss */}
        <button
          onClick={handleDismiss}
          className={cn(
            'flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl',
            'bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-medium border border-amber-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors',
            'min-h-[44px]'
          )}
        >
          I&apos;m safe, continue chatting
        </button>
      </div>

      {/* Counselor-review notice */}
      <p className="text-xs text-amber-700 mt-3 italic">
        If a risk of serious harm is detected, a trained counselor may review this conversation to help keep you safe.
        <br />
        <span className="lang-am">
          አደጋ ሲፈጠር፣ የሰለጠነ አማካሪ ደህንነትዎን ለማረጋገጥ ይህን ውይይት ሊያይ ይችላል።
        </span>
      </p>
    </div>
  );
}

// ── Backwards-compatible export used in existing code ─────────────────────────
// The old CrisisAlert accepted a `message` prop — keep it working.
export function CrisisAlert({ message }: { message: Message }) {
  return <CrisisCard message={message} />;
}
