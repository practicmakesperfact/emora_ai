// ============================================================
// Emora AI — Textarea Component
// ============================================================

import React, { forwardRef } from 'react';
import { cn } from '@/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-rose-500" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400',
            'transition-colors duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400',
            'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500',
            error
              ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
              : 'border-slate-200 hover:border-slate-300',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-rose-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
