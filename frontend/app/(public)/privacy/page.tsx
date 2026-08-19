// ============================================================
// Emora AI — Privacy Policy (/privacy)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Heart } from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const metadata = {
  title: 'Privacy Policy — Emora AI',
  description: 'Learn how your data is handled on Emora AI Support.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link href={ROUTES.HOME} aria-label="Back to home page">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-indigo-500" aria-hidden />
            <span className="text-sm font-semibold text-slate-800">Emora</span>
          </div>
        </div>

        {/* Hero Card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Shield className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Privacy & Data Policy</h1>
              <p className="text-xs text-slate-400 mt-0.5">Last updated: August 2026</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4 text-sm">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">1. Overview</h2>
              <p>
                Emora is a mental health chatbot support application designed for local operation.
                Because user privacy is paramount, we minimize third-party transmission and keep
                your records stored securely in your workspace database.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">2. What Information We Store</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your account details (Name, email address, password hashes).</li>
                <li>Conversations, including messages sent and AI response history.</li>
                <li>Your daily mood tracking scores, emotional tags, and mood notes.</li>
                <li>Your daily journal entries, summaries, and extracted keywords.</li>
                <li>Document metadata and files uploaded to the knowledge base (Admin only).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">3. How Your Data is Used</h2>
              <p>
                Your data is exclusively processed to display historical logs, track mood trends,
                provide context-rich AI conversation response (via prompt-injection models like Llama),
                and highlight crisis resources when safety triggers detect intense emotional distress.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl">
                <strong className="font-semibold">Note:</strong> {APP_DISCLAIMER}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">4. Third-Party Services</h2>
              <p>
                All data matches remain within the local container or server workspace database.
                Vector embeddings are processed locally. If a Groq model is used for prompt rendering,
                only context tokens are safely sent over encrypted TLS. No persistent logging of your
                personal identifier is shared with outer services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">5. Your Control & Deletion</h2>
              <p>
                You can delete specific mood records, individual journal entries, or entire conversations
                directly from the application interface. When deleted, all associated records are
                purged from the workspace database.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
