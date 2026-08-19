// ============================================================
// Emora AI — Login Page
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { loginSchema, type LoginFormData } from '@/schemas';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { InlineError } from '@/components/common/Feedback';
import { getErrorMessage } from '@/utils';
import { ROUTES, APP_DISCLAIMER } from '@/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) router.replace(ROUTES.DASHBOARD);
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setApiError(null);
    try {
      await login(data);
      router.push(ROUTES.DASHBOARD);
    } catch (err) {
      setApiError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-200">
            <Heart className="w-6 h-6 text-white" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Sign in to continue your support journey
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Sign in form"
          >
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                required
                {...register('password')}
              />

              {apiError && <InlineError message={apiError} />}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
              >
                Sign In
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href={ROUTES.REGISTER}
              className="text-indigo-600 font-medium hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed px-2">
          {APP_DISCLAIMER}
        </p>

        <div className="mt-4 flex justify-center gap-4">
          <Link
            href={ROUTES.PRIVACY}
            className="text-xs text-slate-400 hover:text-indigo-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
          >
            Privacy Policy
          </Link>
          <Link
            href={ROUTES.SUPPORT}
            className="text-xs text-slate-400 hover:text-indigo-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
          >
            Crisis Support
          </Link>
        </div>
      </div>
    </div>
  );
}
