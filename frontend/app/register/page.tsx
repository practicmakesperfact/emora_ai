// ============================================================
// Emora AI — Register Page
// Includes role selection (User / Counselor).
// Role-aware redirect after registration.
// ============================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Mail, Lock, User, Briefcase } from 'lucide-react';
import { useAuth, getRoleHome } from '@/providers/AuthProvider';
import { registerSchema, type RegisterFormData } from '@/schemas';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { InlineError } from '@/components/common/Feedback';
import { getApiErrorMessage } from '@/lib/api/client';
import { ROUTES, APP_DISCLAIMER, PRIVACY_NOTICE, ROLES } from '@/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister, user, isLoading } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // If already logged in redirect by role
  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace(getRoleHome(user));
    }
  }, [user, isLoading, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      role_name: ROLES.USER,
      preferred_language: 'en',
      time_zone: 'UTC',
    },
  });

  const selectedRole = watch('role_name');

  async function onSubmit(data: RegisterFormData) {
    if (!privacyAccepted) {
      setApiError('Please read and accept the privacy notice to continue.');
      return;
    }
    setApiError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = data;
      // register() returns the User profile — redirect immediately by role
      const profile = await authRegister(payload);
      router.push(getRoleHome(profile));
    } catch (err) {
      setApiError(getApiErrorMessage(err));
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
            method="post"
            noValidate
            aria-label="Create account form"
          >
            <div className="space-y-4">

              {/* ── Role selection ── */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  I am signing up as
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* User option */}
                  <label
                    className={[
                      'flex items-center gap-2.5 cursor-pointer rounded-xl border-2 px-3 py-3 transition-colors',
                      selectedRole === ROLES.USER
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      value={ROLES.USER}
                      className="sr-only"
                      {...register('role_name')}
                    />
                    <User
                      className={`w-4 h-4 shrink-0 ${selectedRole === ROLES.USER ? 'text-indigo-600' : 'text-slate-400'}`}
                      aria-hidden
                    />
                    <div>
                      <p className={`text-xs font-semibold ${selectedRole === ROLES.USER ? 'text-indigo-700' : 'text-slate-700'}`}>
                        User
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Seeking support
                      </p>
                    </div>
                  </label>

                  {/* Counselor option */}
                  <label
                    className={[
                      'flex items-center gap-2.5 cursor-pointer rounded-xl border-2 px-3 py-3 transition-colors',
                      selectedRole === ROLES.COUNSELOR
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      value={ROLES.COUNSELOR}
                      className="sr-only"
                      {...register('role_name')}
                    />
                    <Briefcase
                      className={`w-4 h-4 shrink-0 ${selectedRole === ROLES.COUNSELOR ? 'text-emerald-600' : 'text-slate-400'}`}
                      aria-hidden
                    />
                    <div>
                      <p className={`text-xs font-semibold ${selectedRole === ROLES.COUNSELOR ? 'text-emerald-700' : 'text-slate-700'}`}>
                        Counselor
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Monitoring dashboard
                      </p>
                    </div>
                  </label>
                </div>
              </div>

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
                {selectedRole === ROLES.COUNSELOR
                  ? 'Create Counselor Account'
                  : 'Create Account'}
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
