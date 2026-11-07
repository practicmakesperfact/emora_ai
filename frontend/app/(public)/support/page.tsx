// ============================================================
// Emora AI — Support Page (/support)
// Ethiopian crisis & mental health support resources
// ============================================================

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, ShieldAlert, Heart, Building2 } from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const metadata = {
  title: 'Crisis Support — Emora AI',
  description: 'Ethiopian crisis support networks and professional mental health resource guide.',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
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

        {/* Support Card */}
        <Card padding="lg" className="space-y-5">
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
            Emora is an AI support assistant. It cannot provide medical diagnosis, treatment, or active
            crisis intervention. If you are experiencing thoughts of self-harm or are in immediate
            distress, please connect with human support networks right away.
          </p>

          <div className="space-y-4 pt-2 text-sm text-slate-700">
            <h2 className="text-base font-semibold text-slate-800">
              🇪🇹 Ethiopian Emergency &amp; Mental Health Resources
            </h2>

            <ul className="space-y-4">
              {/* Emergency Services */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-rose-50 text-rose-600 mt-0.5 shrink-0" aria-hidden>
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    🆘 የአደጋ ጊዜ አገልግሎት / Emergency Services
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    <strong className="text-slate-700">939</strong> — ፖሊስ / Police
                    <br />
                    <strong className="text-slate-700">907</strong> — አምቡላንስ / Ambulance (Addis Ababa)
                    <br />
                    <strong className="text-slate-700">991</strong> — አጠቃላይ የአደጋ ጊዜ / General Emergency
                  </p>
                </div>
              </li>

              {/* Mental Health Helpline */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    📞 የአእምሮ ጤና የስልክ መስመር / Mental Health Helpline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    <strong className="text-slate-700">8335</strong> — ነፃ፣ 24 ሰዓት / Free, 24/7
                    confidential mental health support
                  </p>
                </div>
              </li>

              {/* Amanuel Hospital */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    🏥 አማኑኤል የአእምሮ ጤና ስፔሻላይዝድ ሆስፒታል / Amanuel Mental Specialized Hospital
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Ethiopia&apos;s primary public psychiatric hospital — handles acute psychiatric
                    conditions, severe depression, and mental health crises.
                    <br />
                    📍 Addis Ababa, Ethiopia
                  </p>
                </div>
              </li>

              {/* Tikur Anbessa */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    🏥 ጥቁር አንበሳ ስፔሻላይዝድ ሆስፒታል / Tikur Anbessa (Black Lion) Hospital
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Comprehensive specialized hospital with psychiatric and emergency services.
                    <br />
                    📍 Addis Ababa, Ethiopia
                  </p>
                </div>
              </li>

              {/* St. Paul's */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Building2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    🏥 ቅዱስ ጳውሎስ ሆስፒታል / St. Paul&apos;s Hospital Millennium Medical College
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Major teaching hospital with mental health and emergency departments.
                    <br />
                    📍 Addis Ababa, Ethiopia
                  </p>
                </div>
              </li>

              {/* Fitret Counseling */}
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Heart className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">
                    💬 Fitret Counseling / ፍጥረት ምክር አገልግሎት
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Professional therapy and counseling services in Addis Ababa.
                    <br />
                    📞 +251 915 484 852 (Phone / WhatsApp)
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="font-medium text-slate-500">ማስታወሻ / Note: </strong>
              አዲስ አበባ ውጭ ከሆኑ፣ የቅርብ ሆስፒታል ድንገተኛ ክፍል ወይም የጤና ኬላ ይጎብኙ።
              If you are outside Addis Ababa, please visit the nearest hospital emergency department
              or health center for immediate support.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
