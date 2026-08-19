// ============================================================
// Emora AI — App Layout
// Protected app layout with sidebar + mobile nav
// ============================================================

'use client';

import React, { useState } from 'react';
import { cn } from '@/utils';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Sidebar panel */}
          <div className="relative z-50 flex w-72 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            {/* Close button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="w-5 h-5" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Emora</span>
          </div>
        </div>

        {/* Page content */}
        <main
          id="main-content"
          className={cn('flex-1 overflow-auto')}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
