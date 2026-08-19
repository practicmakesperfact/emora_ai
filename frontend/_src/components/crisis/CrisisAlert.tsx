// ============================================================
// Emora AI — Crisis Alert Component
// Displays calm, supportive crisis UI based on risk level from backend
// ============================================================

'use client';

import React from 'react';
import { Heart, Phone, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/utils';
import type { Message } from '@/types';

interface CrisisAlertProps {
  message: Message;
}

export function CrisisAlert({ message }: CrisisAlertProps) {
  // Extract crisis metadata if backend provides it in source_citations
  const crisisData = message.source_citations as {
    risk_level?: string;
    resources?: Array<{ name: string; contact?: string; description?: string }>;
    guidance?: string;
  } | null;

  const riskLevel = crisisData?.risk_level || 'medium';
  const resources = crisisData?.resources || [];
  const guidance = crisisData?.guidance;

  // We don't show a crisis alert for low risk
  if (riskLevel === 'low' || !message.is_crisis_triggered) return null;

  const config = getCrisisConfig(riskLevel);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-2xl border p-4 mb-2',
        config.containerClass
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('p-1.5 rounded-xl shrink-0', config.iconBg)}>
          <config.Icon className={cn('w-4 h-4', config.iconColor)} aria-hidden />
        </div>
        <div>
          <h3 className={cn('font-semibold text-sm', config.titleColor)}>
            {config.title}
          </h3>
          <p className={cn('text-xs mt-0.5 leading-relaxed', config.bodyColor)}>
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Guidance from backend */}
      {guidance && (
        <p className={cn('text-xs leading-relaxed mb-3', config.bodyColor)}>
          {guidance}
        </p>
      )}

      {/* Support steps */}
      <div className="space-y-2 mb-3">
        <SupportStep
          icon={<Heart className="w-3.5 h-3.5" />}
          text="Reach out to someone you trust — a friend, family member, or colleague."
          colorClass={config.stepColor}
        />
        <SupportStep
          icon={<Phone className="w-3.5 h-3.5" />}
          text="Contact a professional counselor or mental health service near you."
          colorClass={config.stepColor}
        />
        {riskLevel === 'critical' && (
          <SupportStep
            icon={<Shield className="w-3.5 h-3.5" />}
            text="If you are in immediate danger, please contact emergency services."
            colorClass={config.stepColor}
          />
        )}
      </div>

      {/* Resources from backend only */}
      {resources.length > 0 && (
        <div className={cn('rounded-xl p-3', config.resourcesBg)}>
          <p className={cn('text-xs font-semibold mb-2', config.titleColor)}>
            Support resources
          </p>
          <ul className="space-y-1.5">
            {resources.map((res, i) => (
              <li key={i} className="text-xs">
                <span className={cn('font-medium', config.titleColor)}>
                  {res.name}
                </span>
                {res.contact && (
                  <span className={config.bodyColor}> — {res.contact}</span>
                )}
                {res.description && (
                  <p className={cn('text-xs mt-0.5', config.bodyColor)}>
                    {res.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation notice */}
      <p className={cn('text-xs mt-3 italic', config.bodyColor)}>
        {config.escalationNote}
      </p>
    </div>
  );
}

function SupportStep({
  icon,
  text,
  colorClass,
}: {
  icon: React.ReactNode;
  text: string;
  colorClass: string;
}) {
  return (
    <div className={cn('flex items-start gap-2', colorClass)}>
      <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}

interface CrisisConfig {
  title: string;
  subtitle: string;
  containerClass: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  stepColor: string;
  resourcesBg: string;
  escalationNote: string;
  Icon: React.ElementType;
}

function getCrisisConfig(level: string): CrisisConfig {
  switch (level.toLowerCase()) {
    case 'critical':
      return {
        title: "We're here for you",
        subtitle:
          'The conversation indicates you may be experiencing significant distress. Your safety matters deeply.',
        containerClass: 'bg-rose-50 border-rose-200',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        titleColor: 'text-rose-800',
        bodyColor: 'text-rose-700',
        stepColor: 'text-rose-700',
        resourcesBg: 'bg-rose-100/60',
        escalationNote:
          'A counselor has been notified and will follow up with you.',
        Icon: Shield,
      };
    case 'high':
      return {
        title: 'Support is available',
        subtitle:
          "It sounds like you're going through a very difficult time. You don't have to face this alone.",
        containerClass: 'bg-orange-50 border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-800',
        bodyColor: 'text-orange-700',
        stepColor: 'text-orange-700',
        resourcesBg: 'bg-orange-100/60',
        escalationNote:
          'This has been flagged for counselor review so you can receive additional support.',
        Icon: AlertCircle,
      };
    default: // medium
      return {
        title: 'Here to support you',
        subtitle:
          "It sounds like things feel difficult right now. I'm here with you.",
        containerClass: 'bg-amber-50 border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        titleColor: 'text-amber-800',
        bodyColor: 'text-amber-700',
        stepColor: 'text-amber-700',
        resourcesBg: 'bg-amber-100/60',
        escalationNote:
          'Remember: reaching out for help is a sign of strength.',
        Icon: Heart,
      };
  }
}
