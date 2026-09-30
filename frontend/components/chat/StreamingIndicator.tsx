// ============================================================
// Emora AI — StreamingIndicator Component
// The animated three-dot indicator shown when AI is thinking
// ============================================================

import React from 'react';
import { Sparkles } from 'lucide-react';

export function StreamingIndicator() {
  return (
    <div className="flex gap-3 items-start" aria-live="polite" aria-atomic="false">
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-white" aria-hidden />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm">
        <div className="flex gap-1 items-center py-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
          <span className="sr-only">AI is responding…</span>
        </div>
      </div>
    </div>
  );
}
