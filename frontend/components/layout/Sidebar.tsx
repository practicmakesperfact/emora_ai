// ============================================================
// Emora AI — Sidebar Navigation
// Supports:
//  - collapsed=false → full label+icon sidebar
//  - collapsed=true  → icon-only rail with Tooltip on hover
//  - onClose         → called on mobile when a link is tapped
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuth } from '@/providers/AuthProvider';
import { ROUTES, ROLES } from '@/constants';
import { CRISIS_CARD_CONTACTS } from '@/lib/emergencyContacts';
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
  PhoneCall,
} from 'lucide-react';
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: [ROLES.USER, ROLES.COUNSELOR, ROLES.ADMIN],
  },
  {
    href: ROUTES.CHAT,
    label: 'Chat',
    icon: <MessageCircle className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  {
    href: ROUTES.MOOD,
    label: 'Mood Tracker',
    icon: <Heart className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  {
    href: ROUTES.JOURNAL,
    label: 'Journal',
    icon: <BookOpen className="w-4 h-4" />,
    roles: [ROLES.USER],
  },
  // Counselor
  {
    href: ROUTES.COUNSELOR_DASHBOARD,
    label: 'Counselor Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: [ROLES.COUNSELOR, ROLES.ADMIN],
  },
  {
    href: ROUTES.COUNSELOR_INCIDENTS,
    label: 'Crisis Incidents',
    icon: <AlertTriangle className="w-4 h-4" />,
    roles: [ROLES.COUNSELOR, ROLES.ADMIN],
  },
  // Admin
  {
    href: ROUTES.ADMIN_DASHBOARD,
    label: 'Admin Dashboard',
    icon: <Shield className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_DOCUMENTS,
    label: 'Upload Documents',
    icon: <FileText className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_KNOWLEDGE_BASE,
    label: 'Knowledge Base',
    icon: <Database className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
  {
    href: ROUTES.ADMIN_USERS,
    label: 'Users',
    icon: <Users className="w-4 h-4" />,
    roles: [ROLES.ADMIN],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    href: ROUTES.PROFILE,
    label: 'Profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    href: ROUTES.SETTINGS,
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
  },
  {
    href: ROUTES.ABOUT,
    label: 'About',
    icon: <Info className="w-4 h-4" />,
  },
];

interface SidebarProps {
  onClose?: () => void;
  /** When true, renders icon-only rail with tooltips (desktop collapsed state) */
  collapsed?: boolean;
}

/** Wrapper that shows a tooltip on hover when sidebar is collapsed */
function NavTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
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

export function Sidebar({ onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userRole = user?.role?.name || ROLES.USER;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  function isActive(href: string): boolean {
    if (href === ROUTES.CHAT) return pathname === ROUTES.CHAT || pathname.startsWith('/chat/');
    return pathname === href || pathname.startsWith(href + '/');
  }

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
          href={ROUTES.DASHBOARD}
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

      {/* User info — hidden when collapsed */}
      {user && !collapsed && (
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-indigo-700">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">{userRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav
        className={cn('flex-1 overflow-y-auto py-3 space-y-0.5 sidebar-scroll', collapsed ? 'px-1 w-full' : 'px-3')}
        aria-label="Primary"
      >
        {visibleItems.map((item) => (
          <NavTooltip key={item.href} label={item.label} collapsed={collapsed}>
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
              aria-label={collapsed ? item.label : undefined}
            >
              <span
                className={cn(
                  isActive(item.href) ? 'text-indigo-600' : 'text-slate-400'
                )}
                aria-hidden
              >
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          </NavTooltip>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className={cn('py-3 border-t border-slate-100 space-y-0.5', collapsed ? 'px-1 w-full' : 'px-3')}>
        {BOTTOM_ITEMS.map((item) => (
          <NavTooltip key={item.href} label={item.label} collapsed={collapsed}>
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
              aria-label={collapsed ? item.label : undefined}
            >
              <span className={cn(isActive(item.href) ? 'text-indigo-600' : 'text-slate-400')} aria-hidden>
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          </NavTooltip>
        ))}

        {/* Logout */}
        <NavTooltip label="Sign Out" collapsed={collapsed}>
          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className={cn(
              'w-full flex items-center rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400',
              collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'
            )}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            {!collapsed && 'Sign Out'}
          </button>
        </NavTooltip>

        {/* Help card — hidden when collapsed */}
        {!collapsed && (
          <div className="mt-3 mx-1">
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <PhoneCall className="w-3 h-3 text-rose-600" aria-hidden />
                <p className="text-xs font-medium text-rose-700">
                  Need immediate support?
                </p>
              </div>
              {/* Show primary hotline as tap-to-call — number from central config */}
              {CRISIS_CARD_CONTACTS[0] && (
                <a
                  href={`tel:${CRISIS_CARD_CONTACTS[0].number}`}
                  className="block text-xs font-semibold text-rose-700 hover:underline mb-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded"
                  aria-label={`Call ${CRISIS_CARD_CONTACTS[0].nameEn} at ${CRISIS_CARD_CONTACTS[0].number}`}
                >
                  📞 {CRISIS_CARD_CONTACTS[0].number} · {CRISIS_CARD_CONTACTS[0].nameEn}
                </a>
              )}
              <Link href={ROUTES.SUPPORT} onClick={onClose} className="text-xs text-rose-500 hover:underline focus:outline-none">
                All crisis resources →
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
