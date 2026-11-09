// ============================================================
// Emora AI — App Layout (Step 1 upgrade)
// Top bar: sidebar toggle + language switcher + "Get help now"
// Desktop: collapsible sidebar (icon rail when collapsed)
// Mobile: hamburger → slide-in drawer with overlay
// State: sidebarCollapsed persisted to localStorage
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/utils';
import { Sidebar } from './Sidebar';
import { Menu, X, PhoneCall } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { ROUTES } from '@/constants';

const COLLAPSED_KEY = 'emora_sidebar_collapsed';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { lang, setLang, t } = useLanguage();

  // Restore sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  // Close mobile drawer on Esc key
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Trap focus inside mobile drawer when open
  useEffect(() => {
    if (mobileOpen) drawerRef.current?.focus();
  }, [mobileOpen]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <div
        className={cn(
          'hidden md:flex md:flex-col shrink-0 transition-all duration-200',
          collapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('Navigation menu', 'ዋና ምናሌ')}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Drawer panel */}
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="relative z-50 flex w-72 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200 outline-none"
          >
            {/* Close button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                aria-label={t('Close navigation menu', 'ምናሌን ዝጋ')}
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <Sidebar onClose={() => setMobileOpen(false)} collapsed={false} />
          </div>
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar — visible at all widths */}
        <TopBar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onMobileOpen={() => setMobileOpen(true)}
          mobileOpen={mobileOpen}
          lang={lang}
          setLang={setLang}
          t={t}
        />

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

// ─── Top Bar ────────────────────────────────────────────────────────────────
interface TopBarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onMobileOpen: () => void;
  mobileOpen: boolean;
  lang: 'en' | 'am';
  setLang: (l: 'en' | 'am') => void;
  t: (en: string, am: string) => string;
}

function TopBar({
  collapsed,
  onToggleCollapsed,
  onMobileOpen,
  mobileOpen,
  lang,
  setLang,
  t,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-100 shrink-0">
      {/* Left: Hamburger (mobile) or Collapse toggle (desktop) */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={onMobileOpen}
          aria-label={t('Open navigation menu', 'ምናሌ ክፈት')}
          aria-expanded={mobileOpen}
        >
          <Menu className="w-5 h-5" aria-hidden />
        </button>

        {/* Desktop collapse toggle */}
        <button
          className="hidden md:flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 min-w-[44px] min-h-[44px] transition-colors"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t('Expand sidebar', 'የጎን ምናሌ አሰፋ') : t('Collapse sidebar', 'የጎን ምናሌ አሳጥር')}
          aria-pressed={collapsed}
        >
          <Menu className="w-5 h-5" aria-hidden />
        </button>

        {/* Mobile wordmark */}
        <span className="md:hidden font-semibold text-slate-800 text-sm">Emora</span>
      </div>

      {/* Right: Language switcher + Get help now */}
      <div className="flex items-center gap-2">
        {/* Language segmented toggle */}
        <div
          className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold"
          role="group"
          aria-label={t('Language switcher', 'ቋንቋ ቀያሪ')}
        >
          <button
            onClick={() => setLang('en')}
            className={cn(
              'px-3 py-1.5 min-w-[44px] min-h-[36px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400',
              lang === 'en'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            )}
            aria-pressed={lang === 'en'}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            onClick={() => setLang('am')}
            className={cn(
              'px-3 py-1.5 min-w-[44px] min-h-[36px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 lang-am',
              lang === 'am'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            )}
            aria-pressed={lang === 'am'}
            aria-label="Switch to Amharic / አማርኛ ቀይር"
          >
            አማ
          </button>
        </div>

        {/* Get help now — always visible, red-tinted */}
        <Link
          href={ROUTES.SUPPORT}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-colors min-h-[36px] whitespace-nowrap"
          aria-label={t('Get help now — crisis support', 'አሁን እርዳታ ያግኙ')}
        >
          <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t('Get help now', 'አሁን ርዳታ')}</span>
          <span className="sm:hidden">SOS</span>
        </Link>
      </div>
    </header>
  );
}
