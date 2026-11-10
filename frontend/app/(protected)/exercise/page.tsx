// ============================================================
// Emora AI — Breathing Exercise Page (/exercise)
// Step 9: 4-4-6 guided breathing with animated circle.
//         Respects prefers-reduced-motion AND the localStorage
//         emora_reduced_motion setting set in Settings page.
// ============================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wind } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';

// ── Breathing pattern definition ─────────────────────────────────────────────
// 4-4-6: inhale 4s, hold 4s, exhale 6s — total 14s per cycle
const PHASES = [
  { label: 'Inhale',  amLabel: 'ይተንፍሱ',   seconds: 4, hint: 'Breathe in slowly through your nose', scale: 1.3 },
  { label: 'Hold',    amLabel: 'ያቆዩ',     seconds: 4, hint: 'Hold gently', scale: 1.3 },
  { label: 'Exhale',  amLabel: 'ይተፉ',     seconds: 6, hint: 'Breathe out slowly through your mouth', scale: 1.0 },
] as const;

type PhaseIndex = 0 | 1 | 2;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExercisePage() {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState<PhaseIndex>(0);
  const [countdown, setCountdown] = useState<number>(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);

  // Detect reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stored = localStorage.getItem('emora_reduced_motion') === 'true';
    setReducedMotion(mq.matches || stored);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches || stored);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<PhaseIndex>(0);
  const countRef = useRef<number>(PHASES[0].seconds);

  function tick() {
    countRef.current -= 1;
    if (countRef.current <= 0) {
      // Advance to next phase
      const nextPhase = ((phaseRef.current + 1) % 3) as PhaseIndex;
      phaseRef.current = nextPhase;
      countRef.current = PHASES[nextPhase].seconds;
      setPhaseIdx(nextPhase);
      setCountdown(PHASES[nextPhase].seconds);
      if (nextPhase === 0) setCycles((c) => c + 1);
    } else {
      setCountdown(countRef.current);
    }
  }

  function startExercise() {
    phaseRef.current = 0;
    countRef.current = PHASES[0].seconds;
    setPhaseIdx(0);
    setCountdown(PHASES[0].seconds);
    setCycles(0);
    setRunning(true);
  }

  function stopExercise() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const phase = PHASES[phaseIdx];

  // Circle animation scale — skip if reduced motion
  const circleScale = running && !reducedMotion ? phase.scale : 1;
  const transitionDuration = running && !reducedMotion ? `${phase.seconds}s` : '0s';

  // Color per phase
  const phaseColor: Record<PhaseIndex, string> = {
    0: 'border-teal-400 bg-teal-50',   // inhale
    1: 'border-indigo-400 bg-indigo-50', // hold
    2: 'border-slate-300 bg-white',      // exhale
  };
  const textColor: Record<PhaseIndex, string> = {
    0: 'text-teal-700',
    1: 'text-indigo-700',
    2: 'text-slate-600',
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.DASHBOARD} aria-label="Back to dashboard">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Breathing Exercise</h1>
          <p className="text-sm text-slate-500">4-4-6 · Inhale · Hold · Exhale</p>
        </div>
      </div>

      {/* Intro card */}
      <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-800 leading-relaxed">
        <div className="flex items-start gap-2">
          <Wind className="w-4 h-4 mt-0.5 shrink-0 text-teal-500" aria-hidden />
          <p>
            This gentle breathing pattern helps calm your nervous system. Breathe in for
            <strong> 4 seconds</strong>, hold for <strong>4 seconds</strong>, and breathe out
            slowly for <strong>6 seconds</strong>. Repeat for a few cycles.
          </p>
        </div>
      </div>

      {/* Animated circle */}
      <div className="flex flex-col items-center gap-6 py-4" aria-live="polite" aria-atomic="true">
        {/* Outer ring (tracks animation) */}
        <div
          className={cn(
            'w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all ease-in-out',
            running ? phaseColor[phaseIdx] : 'border-slate-200 bg-slate-50'
          )}
          style={{
            transform: `scale(${circleScale})`,
            transitionDuration,
          }}
          aria-hidden
        >
          {/* Inner ring */}
          <div
            className={cn(
              'w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center gap-1',
              running ? phaseColor[phaseIdx].replace('border-', 'border-opacity-50 border-') : 'border-slate-100'
            )}
          >
            {running ? (
              <>
                <span className={cn('text-lg font-bold', textColor[phaseIdx])}>
                  {phase.label}
                </span>
                <span className={cn('text-3xl font-bold tabular-nums', textColor[phaseIdx])}>
                  {countdown}
                </span>
              </>
            ) : (
              <Wind className="w-8 h-8 text-slate-300" aria-hidden />
            )}
          </div>
        </div>

        {/* Phase hint */}
        <div className="text-center min-h-[40px]">
          {running ? (
            <>
              <p className="text-sm text-slate-600">{phase.hint}</p>
              <p className="text-xs text-slate-400 mt-0.5 lang-am">{phase.amLabel}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Press Start when you&apos;re ready. Find a comfortable position.
            </p>
          )}
        </div>

        {/* Reduced motion notice */}
        {reducedMotion && running && (
          <p className="text-xs text-slate-400 text-center bg-slate-50 rounded-xl px-3 py-1.5">
            Animation paused — Reduce Motion is on. Numbers still count.
          </p>
        )}

        {/* Cycle counter */}
        {running && cycles > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
            <span>🔄</span>
            <span>{cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!running ? (
          <Button
            onClick={startExercise}
            leftIcon={<Wind className="w-4 h-4" />}
            className="px-8"
          >
            Start
          </Button>
        ) : (
          <Button
            onClick={stopExercise}
            variant="outline"
            className="px-8"
          >
            Stop
          </Button>
        )}
      </div>

      {/* Phase guide */}
      <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phase guide</p>
        <div className="grid grid-cols-3 gap-3">
          {PHASES.map((p, i) => (
            <div
              key={p.label}
              className={cn(
                'rounded-xl p-3 text-center border',
                running && phaseIdx === i
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-slate-100 bg-slate-50'
              )}
            >
              <p className="text-lg font-bold text-indigo-600">{p.seconds}s</p>
              <p className="text-xs font-medium text-slate-700">{p.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">
          One full cycle = 14 seconds · 2 minutes ≈ 8 cycles
        </p>
      </div>
    </div>
  );
}
