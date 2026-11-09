// ============================================================
// Emora AI — Support Page (/support)
// Ethiopian crisis & mental health support resources
// Numbers sourced from lib/emergencyContacts.ts (central config)
// ============================================================

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  ShieldAlert,
  Heart,
  Building2,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  EMERGENCY_CONTACTS,
  CONTACTS_LAST_VERIFIED,
  getContactsByCategory,
} from '@/lib/emergencyContacts';

export const metadata = {
  title: 'Crisis Support — Emora AI',
  description: 'Ethiopian crisis support networks and professional mental health resource guide.',
};

export default function SupportPage() {
  const hotlines    = getContactsByCategory('hotline');
  const emergency   = getContactsByCategory('emergency');
  const hospitals   = getContactsByCategory('hospital');
  const counseling  = getContactsByCategory('counseling');
  const local       = getContactsByCategory('local');

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.HOME} aria-label="Back to home page">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-rose-500" aria-hidden />
            <span className="text-sm font-semibold text-slate-800">Emora</span>
          </div>
        </div>

        {/* Header card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                የቀውስ እና ድጋፍ ምንጮች / Crisis &amp; Support Resources
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                እባክዎ ይህን አስፈላጊ የደህንነት መረጃ ያንብቡ / Please read this important safety information
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Emora AI-ን መሰረት ያደረገ የአእምሮ ጤና ድጋፍ ረዳት ነው። የሕክምና ምርመራ፣ ሕክምና ወይም
            ንቁ የቀውስ ጣልቃ ገብነት ማቅረብ አይችልም። ራስን የመጉዳት ሃሳብ ካለዎት ወይም
            አፋጣኝ ጭንቀት ውስጥ ከሆኑ፣ እባክዎ ከሰው ድጋፍ አውታሮች ጋር ይገናኙ።
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Emora is an AI support assistant. It cannot provide medical diagnosis, treatment,
            or active crisis intervention. If you are experiencing thoughts of self-harm or are
            in immediate distress, please connect with human support networks right away.
          </p>

          {/* Last verified note */}
          {CONTACTS_LAST_VERIFIED && (
            <p className="text-xs text-slate-400 italic">
              Numbers last verified on{' '}
              <span className="font-medium text-slate-500">{CONTACTS_LAST_VERIFIED}</span>.
              {' '}If a number is incorrect, please contact the app administrator.
            </p>
          )}
        </Card>

        {/* ── Hotlines ───────────────────────────────────────────────────────── */}
        <SectionCard
          icon={<Phone className="w-5 h-5 text-indigo-600" />}
          titleEn="Mental Health Hotlines"
          titleAm="የአእምሮ ጤና የስልክ መስመሮች"
          bgClass="bg-indigo-50"
        >
          {hotlines.map((c) => (
            <TelButton key={c.id} contact={c} variant="primary" />
          ))}
        </SectionCard>

        {/* ── Emergency Services ─────────────────────────────────────────────── */}
        <SectionCard
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          titleEn="Emergency Services"
          titleAm="የአደጋ ጊዜ አገልግሎቶች"
          bgClass="bg-rose-50"
          note="⚠️ Number 939 may be Police or Fire — please verify locally before relying on it."
        >
          {emergency.map((c) => (
            <TelButton key={c.id} contact={c} variant="emergency" />
          ))}
        </SectionCard>

        {/* ── Hospitals ──────────────────────────────────────────────────────── */}
        <SectionCard
          icon={<Building2 className="w-5 h-5 text-slate-600" />}
          titleEn="Hospitals (Addis Ababa)"
          titleAm="ሆስፒታሎች (አዲስ አበባ)"
          bgClass="bg-slate-50"
        >
          {hospitals.map((c) => (
            <HospitalRow key={c.id} contact={c} />
          ))}
        </SectionCard>

        {/* ── Counseling ─────────────────────────────────────────────────────── */}
        {counseling.length > 0 && (
          <SectionCard
            icon={<MessageCircle className="w-5 h-5 text-indigo-600" />}
            titleEn="Private Counseling"
            titleAm="የግል ምክር"
            bgClass="bg-indigo-50"
          >
            {counseling.map((c) => (
              <TelButton key={c.id} contact={c} variant="primary" />
            ))}
          </SectionCard>
        )}

        {/* ── Local Resources (Wollo / Dessie) ───────────────────────────────── */}
        <SectionCard
          icon={<Heart className="w-5 h-5 text-amber-600" />}
          titleEn="Local Resources (Dessie / Wollo)"
          titleAm="የአካባቢ ምንጮች (ደሴ / ወሎ)"
          bgClass="bg-amber-50"
          note="⚠️ TODO: These entries need phone numbers and details — please fill in lib/emergencyContacts.ts."
        >
          {local.map((c) => (
            <HospitalRow key={c.id} contact={c} />
          ))}
        </SectionCard>

        {/* Footer note */}
        <Card padding="md">
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="font-medium text-slate-500">ማስታወሻ / Note: </strong>
            አዲስ አበባ ውጭ ከሆኑ፣ የቅርብ ሆስፒታል ድንገተኛ ክፍል ወይም የጤና ኬላ ይጎብኙ።
            If you are outside Addis Ababa, please visit the nearest hospital emergency
            department or health center for immediate support.
          </p>
        </Card>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

import type { EmergencyContact } from '@/lib/emergencyContacts';

function SectionCard({
  icon,
  titleEn,
  titleAm,
  bgClass,
  note,
  children,
}: {
  icon: React.ReactNode;
  titleEn: string;
  titleAm: string;
  bgClass: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${bgClass}`}>{icon}</div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{titleEn}</h2>
          <p className="text-xs text-slate-400 lang-am">{titleAm}</p>
        </div>
      </div>
      {note && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-amber-700">{note}</p>
        </div>
      )}
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

/** Tap-to-call button for numbers */
function TelButton({
  contact,
  variant,
}: {
  contact: EmergencyContact;
  variant: 'primary' | 'emergency';
}) {
  const isPrimary = variant === 'primary';
  if (!contact.number) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-100 border border-slate-200">
        <Phone className="w-4 h-4 text-slate-400" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{contact.nameEn}</p>
          <p className="text-xs text-slate-400 lang-am">⚠️ TODO: add number</p>
        </div>
      </div>
    );
  }
  return (
    <a
      href={`tel:${contact.number}`}
      className={[
        'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors',
        'focus:outline-none focus-visible:ring-2',
        isPrimary
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-400'
          : 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-400',
      ].join(' ')}
      aria-label={`Call ${contact.nameEn} at ${contact.number}`}
    >
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Phone className="w-4 h-4" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">
          {contact.number} — {contact.nameEn}
        </p>
        <p className="text-xs text-white/80 leading-tight lang-am">
          {contact.nameAm} · {contact.availabilityEn}
        </p>
      </div>
    </a>
  );
}

/** Row for hospitals/places without a direct phone number */
function HospitalRow({ contact }: { contact: EmergencyContact }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <span className="p-1 rounded bg-slate-100 text-slate-500 mt-0.5 shrink-0" aria-hidden>
        <Building2 className="w-3.5 h-3.5" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-800">{contact.nameEn}</p>
        <p className="text-xs text-slate-400 lang-am">{contact.nameAm}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{contact.descriptionEn}</p>
        {contact.location && (
          <p className="text-xs text-slate-400 mt-0.5">📍 {contact.location}</p>
        )}
        {contact.number && (
          <a
            href={`tel:${contact.number}`}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
          >
            <Phone className="w-3 h-3" aria-hidden />
            {contact.number}
          </a>
        )}
      </div>
    </div>
  );
}
