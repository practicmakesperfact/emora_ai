// ============================================================
// Emora AI — Protected User Layout
// Enforces authentication + redirects
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingPage } from '@/components/common/Feedback';
import { ROUTES } from '@/constants';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingPage />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AppLayout>{children}</AppLayout>;
}
