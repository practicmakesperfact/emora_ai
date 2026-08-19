// ============================================================
// Emora AI — Sidebar Navigation
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { useAuth } from '@/providers/AuthProvider';
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
    label: 'Knowledge Base',
    icon: <FileText className="w-4 h-4" />,
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
}

export function Sidebar({ onClose }: SidebarProps) {
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
      className="flex flex-col h-full bg-white border-r border-slate-100"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link
          href={ROUTES.DASHBOARD}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
          onClick={onClose}
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" aria-hidden />
          </div>
          <span className="font-bold text-slate-800 text-lg">Emora</span>
        </Link>
      </div>

      {/* User info */}
      {user && (
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
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              isActive(item.href)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            )}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <span
              className={cn(
                isActive(item.href) ? 'text-indigo-600' : 'text-slate-400'
              )}
              aria-hidden
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              isActive(item.href)
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            )}
          >
            <span className={cn(isActive(item.href) ? 'text-indigo-600' : 'text-slate-400')} aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 text-slate-400" aria-hidden />
          Sign Out
        </button>

        {/* Stats chart */}
        <div className="mt-3 mx-1">
          <Link href={ROUTES.SUPPORT} onClick={onClose}>
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
              <p className="text-xs font-medium text-indigo-700">
                Need immediate support?
              </p>
              <p className="text-xs text-indigo-500 mt-0.5">
                Access crisis resources →
              </p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
