// ============================================================
// Emora AI — Protected User Layout
// Guards routes under /(protected)/* (chat, mood, journal, etc.)
//
// Rules:
//  - Not authenticated → redirect to /login
//  - Counselor or Admin → redirect to /counselor/dashboard
//    (they have their own portal; user-only pages aren't their home)
//  - User → allow through
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in → send to login
      router.replace(ROUTES.LOGIN);
      return;
    }

    const role = user?.role?.name;
    if (role === ROLES.COUNSELOR || role === ROLES.ADMIN) {
      // Counselors and Admins have their own portal; redirect them home
      router.replace(ROUTES.COUNSELOR_DASHBOARD);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingPage />
      </div>
    );
  }

  // Don't render children until we're sure this is a plain User
  const role = user?.role?.name;
  if (!isAuthenticated || role === ROLES.COUNSELOR || role === ROLES.ADMIN) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
