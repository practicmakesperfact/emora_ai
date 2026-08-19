// ============================================================
// Emora AI — Support Page (/support)
// Calm, instructional guide on accessing support
// ============================================================

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, ShieldAlert, Heart } from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const metadata = {
  title: 'Crisis Support — Emora AI',
  description: 'Crisis support networks and professional mental health resource guide.',
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
              <h1 className="text-xl font-bold text-slate-900">Crisis & Support Resources</h1>
              <p className="text-xs text-slate-400 mt-0.5">Please read this important safety information</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Emora is an AI support assistant. It cannot provide medical diagnosis, treatment, or active crisis intervention. If you are experiencing thoughts of self-harm or are in immediate distress, please connect with human support networks right away.
          </p>

          <div className="space-y-4 pt-2 text-sm text-slate-700">
            <h2 className="text-base font-semibold text-slate-800">Finding Crisis Resources Near You</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Crisis support contact numbers and networks vary significantly by country and region. To ensure you have access to accurate and active services, we recommend the following resources:
            </p>

            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">National Helplines</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Most countries maintain free, confidential, 24/7 mental health and crisis support numbers (e.g., 988 in the US/Canada, 111 in the UK). Check your local government website or directory for details.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">Befrienders Worldwide</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    An international network of crisis centers providing confidential support services globally. You can find helpline details for your country at{' '}
                    <a
                      href="https://www.befrienders.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
                    >
                      befrienders.org
                    </a>.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 shrink-0" aria-hidden>
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-800 text-xs">International Association for Suicide Prevention (IASP)</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Provides a global directory of mental health services and crisis resources. Find details at{' '}
                    <a
                      href="https://www.iasp.info/resources/Crisis_Centres"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 underline font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
                    >
                      iasp.info/resources/Crisis_Centres
                    </a>.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="font-medium text-slate-500">Emergency Services: </strong>
              If you or someone else is in immediate physical danger, please contact your local emergency services (such as 911, 999, or 112) or go to the nearest emergency room.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
