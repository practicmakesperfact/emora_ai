// ============================================================
// Emora AI — Admin Protected Layout
// Enforces Admin role strictly
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingPage } from '@/components/common/Feedback';
import { ROUTES, ROLES } from '@/constants';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.LOGIN);
      } else {
        const role = user?.role?.name || ROLES.USER;
        if (role !== ROLES.ADMIN) {
          router.replace(ROUTES.DASHBOARD);
        }
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingPage />
      </div>
    );
  }

  const role = user?.role?.name || ROLES.USER;
  if (!isAuthenticated || role !== ROLES.ADMIN) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
