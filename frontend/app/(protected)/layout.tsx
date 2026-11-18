// ============================================================
// Emora AI — Protected User Layout
// Guards routes under /(protected)/* (chat, mood, journal, etc.)
//
// Rules:
//  - Not authenticated → redirect to /login
//  - /profile and /settings → accessible by ALL roles (shared pages)
//  - Counselor or Admin trying to access user-only pages → redirect to /counselor/dashboard
//  - User → allow through
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingPage } from '@/components/common/Feedback';
import { ROUTES, ROLES } from '@/constants';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in → send to login
      router.replace(ROUTES.LOGIN);
      return;
    }

    const role = user?.role?.name;
    
    // Profile and Settings are shared by all roles - allow access
    const isSharedRoute = pathname === '/profile' || pathname === '/settings';
    
    if (!isSharedRoute && (role === ROLES.COUNSELOR || role === ROLES.ADMIN)) {
      // Counselors and Admins trying to access user-only pages → redirect to their dashboard
      router.replace(ROUTES.COUNSELOR_DASHBOARD);
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingPage />
      </div>
    );
  }

  // Allow counselors/admins to access profile and settings
  const role = user?.role?.name;
  const isSharedRoute = pathname === '/profile' || pathname === '/settings';
  
  if (!isAuthenticated || (!isSharedRoute && (role === ROLES.COUNSELOR || role === ROLES.ADMIN))) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
