// ============================================================
// Emora AI — First-Time Consent Screen (Step 5)
//
// Shown once before a user's very first chat message.
// Two checkboxes must both be checked to proceed:
//   1. Understand it is an AI, not a therapist
//   2. Understand the counselor-review rule
// Consent stored in localStorage with ISO timestamp.
// EN / AM translatable via useLanguage.
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/constants';
import { useLanguage } from '@/providers/LanguageProvider';

const CONSENT_KEY = 'emora_consent_v1';

export interface ConsentRecord {
  timestamp: string;        // ISO 8601
  checkboxAI: boolean;      // "I understand this is an AI"
  checkboxCounselor: boolean; // "I understand a counselor may review"
  lang: string;             // 'en' | 'am' at time of consent
}

/** Returns stored consent record, or null if never consented */
export function getStoredConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch {
    return null;
  }
}

/** Returns true if the user has already given valid consent */
export function hasConsented(): boolean {
  const record = getStoredConsent();
  return !!(record?.checkboxAI && record?.checkboxCounselor);
}

function storeConsent(lang: string) {
  const record: ConsentRecord = {
    timestamp: new Date().toISOString(),
    checkboxAI: true,
    checkboxCounselor: true,
    lang,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

// ── Component ────────────────────────────────────────────────────────────────

interface ConsentScreenProps {
  /** Called once the user accepts both checkboxes and clicks "I understand, begin" */
  onAccept: () => void;
}

export function ConsentScreen({ onAccept }: ConsentScreenProps) {
  const { t, lang } = useLanguage();
  const [checkedAI, setCheckedAI] = useState(false);
  const [checkedCounselor, setCheckedCounselor] = useState(false);

  const canProceed = checkedAI && checkedCounselor;

  function handleAccept() {
    if (!canProceed) return;
    storeConsent(lang);
    onAccept();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Consent required before chatting', 'ከመጀመርዎ በፊት ፈቃድ ያስፈልጋል')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t('Before your first conversation', 'ከመጀመሪያ ውይይትዎ በፊት')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('Please read and confirm below', 'እባክዎ ያንብቡ እና ከዚህ በታች ያረጋግጡ')}
            </p>
          </div>
        </div>

        {/* Intro */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {t(
            'Emora provides AI-powered emotional support. It is not a substitute for professional mental health care.',
            'ኤሞራ AI-ን መሰረት ያደረገ ስሜታዊ ድጋፍ ይሰጣል። ለሙያዊ የአዕምሮ ጤና ሕክምና ምትክ አይደለም።'
          )}
        </p>

        {/* Checkbox 1 — AI, not a therapist */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={checkedAI}
            onChange={(e) => setCheckedAI(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400 cursor-pointer shrink-0"
            aria-describedby="consent-ai-desc"
          />
          <div>
            <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
              {t(
                'I understand that Emora is an AI assistant, not a licensed therapist or medical professional.',
                'ኤሞራ AI ረዳት መሆኑን፣ ፈቃድ ያለው ቴራፒስት ወይም ሐኪም እንዳልሆነ ተረድቻለሁ።'
              )}
            </span>
          </div>
        </label>

        {/* Checkbox 2 — counselor-review rule */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={checkedCounselor}
            onChange={(e) => setCheckedCounselor(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-400 cursor-pointer shrink-0"
            aria-describedby="consent-counselor-desc"
          />
          <div>
            <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
              {t(
                'I understand that if I express a risk of serious harm, a trained counselor may review part of this conversation to help keep me safe.',
                'ከባድ አደጋ የሚጠቁም ሃሳብ ከገለጽኩ፣ ስልጠና ያለው አማካሪ ደህንነቴን ለማረጋገጥ የውይይቱን ክፍል ሊያይ ይችላል ብዬ ተረድቻለሁ።'
              )}
            </span>
            <div
              id="consent-counselor-desc"
              className="flex items-center gap-1 mt-1"
            >
              <Eye className="w-3 h-3 text-rose-400" aria-hidden />
              <span className="text-xs text-slate-400">
                {t('This is for your safety only.', 'ይህ ለደህንነትዎ ብቻ ነው።')}
              </span>
            </div>
          </div>
        </label>

        {/* Privacy Policy link */}
        <p className="text-xs text-slate-400">
          {t("By continuing, you've read our", "በመቀጠልዎ፣")}
          {' '}
          <Link
            href={ROUTES.PRIVACY}
            className="text-indigo-500 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
            target="_blank"
          >
            {t('Privacy Policy', 'የግላዊነት ፖሊሲ')}
          </Link>
          {t(' and ', ' ን ')}
          <Link
            href={ROUTES.SUPPORT}
            className="text-indigo-500 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
            target="_blank"
          >
            <ExternalLink className="inline w-3 h-3 mr-0.5" aria-hidden />
            {t('Crisis Support', 'የቀውስ ድጋፍ')}
          </Link>
          .
        </p>

        {/* CTA */}
        <Button
          onClick={handleAccept}
          disabled={!canProceed}
          className="w-full"
          aria-disabled={!canProceed}
        >
          {t("I understand, let's begin", 'ገብቶኛል፣ እንጀምር')}
        </Button>

        {!canProceed && (
          <p className="text-center text-xs text-slate-400" role="status">
            {t('Please check both boxes above to continue.', 'ለመቀጠል ሁለቱንም ሳጥኖች ምልክት ያድርጉ።')}
          </p>
        )}
      </div>
    </div>
  );
}
