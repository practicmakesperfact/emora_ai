// ============================================================
// Emora AI — AI Transparency Disclosure Card (Step 5 update)
// Shown at the top of every new conversation before the first
// message is sent. Satisfies req.md §Transparency & Limits.
// Now includes counselor-review notice + EN/AM translation.
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Clock, Eye, ExternalLink } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useLanguage } from '@/providers/LanguageProvider';

export function AIDisclosureCard() {
  const { t } = useLanguage();

  const DISCLOSURES = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden />,
      text: t(
        'I am Emora, an AI assistant — not a licensed therapist or medical professional.',
        'እኔ ኤሞራ ነኝ፣ AI ረዳት — ፈቃድ ያለው ቴራፒስት ወይም ሐኪም አይደለሁም።'
      ),
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />,
      text: t(
        'I cannot diagnose conditions or prescribe treatments. For serious concerns, please consult a qualified professional.',
        'ሕመሞችን ለይቼ ወይም ሕክምና ሊሰጥ አልችልም። ለከባድ ጉዳዮች፣ ብቃት ያለው ሙያተኛ ያማክሩ።'
      ),
    },
    {
      icon: <Eye className="w-3.5 h-3.5 text-rose-500" aria-hidden />,
      // Step 5 requirement: add counselor-review notice
      text: t(
        'If you express a risk of serious harm, a trained counselor may review that part of the conversation to help keep you safe.',
        'ከባድ አደጋ የሚጠቁም ሃሳብ ካሉ፣ ስልጠና ያለው አማካሪ ደህንነትዎን ለማረጋገጥ የውይይቱን ክፍል ሊያይ ይችላል።'
      ),
    },
    {
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" aria-hidden />,
      text: t(
        'Sessions are limited to support healthy use. Regular breaks are encouraged.',
        'ጤናማ አጠቃቀምን ለመደገፍ ስብሰባዎች ተወስነዋል። መደበኛ እረፍቶች ይበረታታሉ።'
      ),
    },
  ];

  return (
    <div
      role="note"
      aria-label={t('Important: AI transparency notice', 'ጠቃሚ: የ AI ግልጽነት ማስታወቂያ')}
      className="mx-auto w-full max-w-lg rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 mb-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            {t('Before we begin', 'ከመጀመራችን በፊት')}
          </p>
          <p className="text-xs text-indigo-500">
            {t('Please read this important notice', 'እባክዎ ይህን አስፈላጊ ማስታወቂያ ያንብቡ')}
          </p>
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
          className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
        >
          <ExternalLink className="w-3 h-3" aria-hidden />
          {t('Crisis support resources', 'የቀውስ ድጋፍ ምንጮች')}
        </Link>
        <Link
          href={ROUTES.PRIVACY}
          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
        >
          {t('Privacy Policy', 'የግላዊነት ፖሊሲ')}
        </Link>
      </div>
    </div>
  );
}
