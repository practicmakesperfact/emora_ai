// ============================================================
// Emora AI — Sidebar Navigation
// Supports:
//  - collapsed=false → full label+icon sidebar
//  - collapsed=true  → icon-only rail with Tooltip on hover
//  - onClose         → called on mobile when a link is tapped
//
// Step Prompt A: ChatGPT-style bottom user menu.
//  - Top user card REMOVED.
//  - Separate Profile / Settings / About / Sign-Out links REMOVED.
//  - Single UserMenuButton at the very bottom opens a popup menu
//    that rises ABOVE the trigger, containing all four actions.
//  - Full ARIA keyboard support (menu / menuitem / arrow keys / Esc).
//  - Collapsed state: avatar-only trigger; popup aligns to sidebar edge.
//  - Labels are bilingual (EN + AM via useLanguage).
//  - Works identically in mobile drawer (collapsed=false) and both
//    protected layouts (UserLayout and CounselorLayout both use AppLayout
//    → Sidebar, so no code duplication needed).
// ============================================================

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { ROUTES, ROLES } from '@/constants';
import {
  MessageCircle,
  BarChart2,
  BookOpen,
  User,
  Settings,
  LogOut,
  Shield,
  FileText,
  Users,
  LayoutDashboard,
  AlertTriangle,
  Heart,
  Info,
  Database,
  ChevronUp,
  Activity,
  Bell,
} from 'lucide-react';

interface NavItem {
  href: string;
  labelEn: string;
  labelAm: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  // User navigation
  {
    href: ROUTES.DASHBOARD,
    labelEn: 'Dashboard',
    labelAm: 'ዋና ገጽ',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  {
    href: ROUTES.CHAT,
    labelEn: 'Chat',
    labelAm: 'ውይይት',
    icon: <MessageCircle className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  {
    href: ROUTES.MOOD,
    labelEn: 'Mood Tracker',
    labelAm: 'የስሜት ክትትል',
    icon: <Heart className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  {
    href: ROUTES.JOURNAL,
    labelEn: 'Journal',
    labelAm: 'ማስታወሻ',
    icon: <BookOpen className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  // Counselor navigation — renamed and different icons
  {
    href: ROUTES.COUNSELOR_DASHBOARD,
    labelEn: 'Overview',
    labelAm: 'አጠቃላይ እይታ',
    icon: <Activity className="w-4 h-4" />,
    roles: [ROLES.COUNSELOR, ROLES.ADMIN],
  },
  {
    href: ROUTES.COUNSELOR_INCIDENTS,
    labelEn: 'Incidents',
    labelAm: 'ክስተቶች',
    icon: <Bell className="w-4 h-4" />,
    roles: [ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // Admin navigation
  {
    href: ROUTES.ADMIN_DASHBOARD,
    labelEn: 'Admin Dashboard',
    labelAm: 'የአስተዳዳሪ ዳሽቦርድ',
    icon: <Shield className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_DOCUMENTS,
    labelEn: 'Upload Documents',
    labelAm: 'ሰነዶችን ስቀል',
    icon: <FileText className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_KNOWLEDGE_BASE,
    labelEn: 'Knowledge Base',
    labelAm: 'የእውቀት ጎተራ',
    icon: <Database className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_USERS,
    labelEn: 'Users',
    labelAm: 'ተጠቃሚዎች',
    icon: <Users className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
];

interface SidebarProps {
  onClose?: () => void;
  /** When true, renders icon-only rail with tooltips (desktop collapsed state) */
  collapsed?: boolean;
}

// ─── NavTooltip ───────────────────────────────────────────────────────────────
/** Shows a floating label on the right when the sidebar is collapsed */
function NavTooltip({
  labelEn,
  labelAm,
  collapsed,
  children,
}: {
  labelEn: string;
  labelAm: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();
  const label = t(labelEn, labelAm);
  
  if (!collapsed) return <>{children}</>;
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg"
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ─── UserMenuButton ───────────────────────────────────────────────────────────
/**
 * Bottom user card that opens a popup menu rising upward.
 * Full ARIA menu pattern: role="menu", role="menuitem", arrow-key navigation,
 * Esc to close, click-outside to close.
 */
interface UserMenuButtonProps {
  collapsed: boolean;
  onClose?: () => void;
}

function UserMenuButton({ collapsed, onClose }: UserMenuButtonProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userRole = user?.role?.name || ROLES.USER;
  const initials = user?.full_name?.charAt(0).toUpperCase() ?? '?';

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ── Close on Esc; arrow-key nav within menu ───────────────────────────────
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    []
  );

  // Focus the first item when menu opens
  useEffect(() => {
    if (open) {
      const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [open]);

  function handleItemClick(action: () => void) {
    setOpen(false);
    onClose?.();
    action();
  }

  // ── Menu items (links + sign out) ────────────────────────────────────────
  const menuItems = [
    {
      label: t('Profile', 'መገለጫ'),
      icon: <User className="w-4 h-4" aria-hidden />,
      action: () => router.push(ROUTES.PROFILE),
      danger: false,
    },
    {
      label: t('Settings', 'ቅንብሮች'),
      icon: <Settings className="w-4 h-4" aria-hidden />,
      action: () => router.push(ROUTES.SETTINGS),
      danger: false,
    },
    {
      label: t('About', 'ስለ ኤሞራ'),
      icon: <Info className="w-4 h-4" aria-hidden />,
      action: () => router.push(ROUTES.ABOUT),
      danger: false,
    },
  ];

  return (
    <div className={cn('relative', collapsed ? 'flex justify-center' : 'w-full')}>
      {/* ── Popup menu — rendered ABOVE the trigger ────────────────────────── */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t('User menu', 'የተጠቃሚ ምናሌ')}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute bottom-full mb-2 z-50',
            'w-52 rounded-xl bg-white border border-slate-100 shadow-xl py-1.5',
            collapsed ? 'left-0' : 'left-0 right-0'
          )}
        >
          {/* Profile / Settings / About */}
          {menuItems.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              tabIndex={-1}
              onClick={() => handleItemClick(item.action)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors"
            >
              <span className="text-slate-400">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Divider */}
          <div className="my-1 border-t border-slate-100" role="separator" aria-hidden />

          {/* Sign out — visually distinct */}
          <button
            role="menuitem"
            tabIndex={-1}
            onClick={() =>
              handleItemClick(() => logout())
            }
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" aria-hidden />
            {t('Sign out', 'ውጣ')}
          </button>
        </div>
      )}

      {/* ── Trigger button ──────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('Open user menu', 'የተጠቃሚ ምናሌ ክፈት')}
        className={cn(
          'w-full flex items-center rounded-xl transition-colors duration-150',
          'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2.5'
        )}
      >
        {/* Avatar circle */}
        <div
          className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"
          aria-hidden
        >
          <span className="text-xs font-semibold text-indigo-700">{initials}</span>
        </div>

        {/* Name + role — hidden when collapsed */}
        {!collapsed && user && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-slate-800 truncate">{user.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{userRole}</p>
          </div>
        )}

        {/* Chevron indicator — hidden when collapsed */}
        {!collapsed && (
          <ChevronUp
            className={cn(
              'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150',
              open ? 'rotate-180' : 'rotate-0'
            )}
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userRole = user?.role?.name || ROLES.USER;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  function isActive(href: string): boolean {
    if (href === ROUTES.CHAT) return pathname === ROUTES.CHAT || pathname.startsWith('/chat/');
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Determine home link based on role
  const homeHref = userRole === ROLES.COUNSELOR || userRole === ROLES.ADMIN 
    ? ROUTES.COUNSELOR_DASHBOARD 
    : ROUTES.DASHBOARD;

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-200',
        collapsed ? 'items-center' : ''
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn('border-b border-slate-100', collapsed ? 'py-4 px-2 w-full flex justify-center' : 'px-5 py-5')}>
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
          onClick={onClose}
          aria-label="Emora home"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-white" aria-hidden />
          </div>
          {!collapsed && (
            <span className="font-bold text-slate-800 text-lg">Emora</span>
          )}
        </Link>
      </div>

      {/* Main Nav */}
      <nav
        className={cn('flex-1 overflow-y-auto py-3 space-y-0.5 sidebar-scroll', collapsed ? 'px-1 w-full' : 'px-3')}
        aria-label="Primary"
      >
        {visibleItems.map((item) => (
          <NavTooltip key={item.href} labelEn={item.labelEn} labelAm={item.labelAm} collapsed={collapsed}>
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                collapsed
                  ? 'justify-center w-10 h-10 mx-auto'
                  : 'gap-3 px-3 py-2.5',
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
              aria-label={collapsed ? t(item.labelEn, item.labelAm) : undefined}
            >
              <span
                className={cn(
                  isActive(item.href) ? 'text-indigo-600' : 'text-slate-400'
                )}
                aria-hidden
              >
                {item.icon}
              </span>
              {!collapsed && t(item.labelEn, item.labelAm)}
            </Link>
          </NavTooltip>
        ))}
      </nav>

      {/* Bottom — user menu button */}
      <div className={cn('py-3 border-t border-slate-100', collapsed ? 'px-1 w-full flex justify-center' : 'px-3')}>
        <NavTooltip labelEn="Account" labelAm="መለያ" collapsed={collapsed}>
          <UserMenuButton collapsed={collapsed} onClose={onClose} />
        </NavTooltip>
      </div>
    </aside>
  );
}
