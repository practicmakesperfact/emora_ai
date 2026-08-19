// ============================================================
// Emora AI — Landing Page (/)
// Calm, welcoming first impression
// ============================================================

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Shield, BookOpen, BarChart2, ArrowRight } from 'lucide-react';
import { ROUTES, APP_DISCLAIMER } from '@/constants';

export const metadata = {
  title: 'Welcome — Emora AI Mental Health Support',
  description: APP_DISCLAIMER,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Nav */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" aria-hidden />
          </div>
          <span className="font-bold text-slate-800 text-lg">Emora</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Sign In
          </Link>
          <Link
            href={ROUTES.REGISTER}
            className="text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main id="main-content" className="px-6 pt-12 pb-20 max-w-5xl mx-auto">
        {/* AI Disclaimer */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
          <Shield className="w-3.5 h-3.5 text-indigo-500" aria-hidden />
          <span className="text-xs text-indigo-700 font-medium">
            AI Support Assistant · Not a substitute for professional care
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5 max-w-2xl">
          A safe space to{' '}
          <span className="text-indigo-600">talk, reflect,</span>
          {' '}and find support
        </h1>

        <p className="text-lg text-slate-600 max-w-xl leading-relaxed mb-8">
          Emora is an AI-powered mental health support assistant. Whether
          you're feeling anxious, overwhelmed, or just need someone to talk
          to — we're here, without judgment.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-4 mb-16">
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 px-6 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            Start a Conversation
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <Link
            href={ROUTES.SUPPORT}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-3 rounded-xl font-medium text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Need immediate support?
          </Link>
        </div>

        {/* Feature grid */}
        <section aria-labelledby="features-heading">
          <h2
            id="features-heading"
            className="text-xl font-semibold text-slate-800 mb-6"
          >
            How Emora can help
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white border border-slate-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <feature.Icon className="w-4 h-4 text-indigo-600" aria-hidden />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer footer */}
        <div className="mt-14 p-5 rounded-2xl bg-slate-100/70 border border-slate-200/60">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="font-medium text-slate-600">Important: </strong>
            {APP_DISCLAIMER} If you are in crisis or need immediate help, please
            contact emergency services or a local crisis helpline.{' '}
            <Link
              href={ROUTES.PRIVACY}
              className="text-indigo-600 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const FEATURES = [
  {
    Icon: MessageCircle,
    title: 'Empathetic Conversations',
    description:
      'Talk through your feelings with an AI trained in CBT techniques and mindfulness approaches.',
  },
  {
    Icon: Heart,
    title: 'Mood Tracking',
    description:
      'Log your mood daily and visualize patterns over time to better understand your wellbeing.',
  },
  {
    Icon: BookOpen,
    title: 'Guided Journaling',
    description:
      'Write freely and receive gentle AI-powered insights about your emotions and thought patterns.',
  },
  {
    Icon: Shield,
    title: 'Crisis Support',
    description:
      'If you ever need immediate help, Emora will connect you with appropriate support and resources.',
  },
  {
    Icon: BarChart2,
    title: 'Wellness Insights',
    description:
      'Understand your emotional trends with clear, supportive charts and summaries — not diagnoses.',
  },
  {
    Icon: ArrowRight,
    title: 'Private & Secure',
    description:
      'Your conversations are private. We explain exactly how your data is handled before you begin.',
  },
];
