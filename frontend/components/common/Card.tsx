// ============================================================
// Emora AI — Card Component
// ============================================================

import React from 'react';
import { cn } from '@/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
}

export function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  as: Component = 'div',
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <Component
      className={cn(
        'rounded-2xl border border-slate-100 bg-white',
        paddings[padding],
        hover &&
          'transition-shadow duration-200 hover:shadow-md cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600" aria-hidden>
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
