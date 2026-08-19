// ============================================================
// Emora AI — Register Page
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { registerSchema, type RegisterFormData } from '@/schemas';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { InlineError } from '@/components/common/Feedback';
import { getErrorMessage } from '@/utils';
import { ROUTES, APP_DISCLAIMER, PRIVACY_NOTICE } from '@/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister, user } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  React.useEffect(() => {
    if (user) router.replace(ROUTES.DASHBOARD);
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      role_name: 'User',
      preferred_language: 'en',
      time_zone: 'UTC',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    if (!privacyAccepted) {
      setApiError('Please read and accept the privacy notice to continue.');
      return;
    }
    setApiError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = data;
      await authRegister(payload);
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
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Begin your mental wellness support journey
          </p>
        </div>

        {/* Privacy notice */}
        <div className="mb-4 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
          <p className="text-xs text-indigo-700 leading-relaxed">{PRIVACY_NOTICE}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Create account form"
          >
            <div className="space-y-4">
              <Input
                label="Full name"
                type="text"
                autoComplete="name"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.full_name?.message as string | undefined}
                required
                {...register('full_name')}
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message as string | undefined}
                required
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message as string | undefined}
                hint="At least 6 characters"
                required
                {...register('password')}
              />

              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message as string | undefined}
                required
                {...register('confirmPassword')}
              />

              {/* Privacy acceptance */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="privacy-accept"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                  aria-required="true"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I understand this is an AI assistant (not a therapist), and
                  I&apos;ve read the{' '}
                  <Link
                    href={ROUTES.PRIVACY}
                    target="_blank"
                    className="text-indigo-600 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {apiError && <InlineError message={apiError} />}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                disabled={!privacyAccepted}
              >
                Create Account
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="text-indigo-600 font-medium hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed px-2">
          {APP_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
