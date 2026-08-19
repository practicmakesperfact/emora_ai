// ============================================================
// Emora AI — About Page (/about)
// ============================================================

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export const metadata = {
  title: 'About — Emora AI',
  description: 'Learn about Emora AI Mental Health Support.',
};

export default function AboutPage() {
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

        {/* Info Card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-6 h-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">About Emora AI</h1>
              <p className="text-xs text-slate-400 mt-0.5">Empathetic support, guided reflections</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4 text-sm">
            <p>
              Emora was created to provide a safe, accessible, and supportive interface for
              individuals looking to explore their emotions, track their mental well-being,
              and receive supportive Cognitive Behavioral Therapy (CBT)-based reflections.
            </p>

            <h2 className="text-base font-semibold text-slate-800">Core Features</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="font-semibold text-slate-700">Empathetic Chatbot:</strong> A chat
                interface connected to Llama models, capable of streaming supportive responses and matching citations from a verified knowledge base.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Mood Tracker:</strong> Daily logging
                of emotional intensities and descriptive tags, with visualization dashboards to help detect trends.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Guided Journaling:</strong> An editor
                that provides automatic emotional analysis and summaries.
              </li>
              <li>
                <strong className="font-semibold text-slate-700">Crisis Monitoring:</strong> A risk detection
                layer that matches responses and escalates high-risk signals to emergency guides.
              </li>
            </ul>

            <h2 className="text-base font-semibold text-slate-800">Disclaimer</h2>
            <p className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl">
              {APP_DISCLAIMER}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
