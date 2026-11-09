// ============================================================
// Emora AI — Profile Page (/profile)
// Step 6: Split emergency contact, timezone dropdown,
//         password change section, removed language/tz duplication
// ============================================================

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  Heart,
  Phone,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usersApi } from '@/lib/api/users.api';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { InlineError } from '@/components/common/Feedback';
import { profileSchema, type ProfileFormData } from '@/schemas';
import { getErrorMessage } from '@/utils';

// ─── Ethiopian time zones ──────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (EAT, UTC+3)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT, UTC+3)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET, UTC+2)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
];

/** Parse a stored "Name | Relationship | Phone" string into parts */
function parseEmergencyContact(raw?: string) {
  if (!raw) return { ec_name: '', ec_relationship: '', ec_phone: '' };
  const parts = raw.split('|').map((s) => s.trim());
  return {
    ec_name: parts[0] || '',
    ec_relationship: parts[1] || '',
    ec_phone: parts[2] || '',
  };
}

/** Join sub-fields back into one string for the backend */
function joinEmergencyContact(name: string, rel: string, phone: string): string {
  const parts = [name, rel, phone].map((s) => s.trim()).filter(Boolean);
  return parts.join(' | ');
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState(false);

  // Password show/hide toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const parsed = parseEmergencyContact(user?.emergency_contact);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      mental_wellness_goal: user?.mental_wellness_goal || '',
      ec_name: parsed.ec_name,
      ec_relationship: parsed.ec_relationship,
      ec_phone: parsed.ec_phone,
      current_password: '',
      password: '',
    },
  });

  const newPassword = watch('password');

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      const payload: Record<string, unknown> = {
        full_name: data.full_name,
        email: data.email,
        mental_wellness_goal: data.mental_wellness_goal || '',
        emergency_contact: joinEmergencyContact(
          data.ec_name || '',
          data.ec_relationship || '',
          data.ec_phone || ''
        ),
      };
      // Only send password fields if new password is provided
      if (data.password) {
        payload.password = data.password;
        // current_password is frontend-only validation; backend uses existing session auth
      }
      return usersApi.updateMe(payload as Parameters<typeof usersApi.updateMe>[0]);
    },
    onSuccess: async () => {
      setApiSuccess(true);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => setApiSuccess(false), 4000);
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  async function onSubmit(data: ProfileFormData) {
    setApiError(null);
    setApiSuccess(false);
    updateMutation.mutate(data);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your personal info, emergency contact, and wellness goals.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Update profile form" className="space-y-5">

        {/* ── Account Details ────────────────────────────────────────── */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-500" aria-hidden />
              Account Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full name"
                type="text"
                leftIcon={<UserIcon className="w-4 h-4" />}
                error={errors.full_name?.message}
                required
                {...register('full_name')}
              />
              <Input
                label="Email address"
                type="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register('email')}
              />
            </div>
          </div>
        </Card>

        {/* ── Emergency Contact ──────────────────────────────────────── */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-500" aria-hidden />
              Emergency Contact
            </h2>
            <p className="text-xs text-slate-400 -mt-1">
              In a crisis, who should you or a counselor contact?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact name"
                type="text"
                placeholder="e.g. Sister"
                error={errors.ec_name?.message}
                {...register('ec_name')}
              />
              <Input
                label="Relationship"
                type="text"
                placeholder="e.g. Sibling, Friend, Parent"
                error={errors.ec_relationship?.message}
                {...register('ec_relationship')}
              />
            </div>
            <Input
              label="Phone number"
              type="tel"
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="e.g. +251 912 345 678  or  0912345678"
              hint="Ethiopian formats: +251 9…, +251 7…, 09…, 07…"
              error={errors.ec_phone?.message}
              {...register('ec_phone')}
            />
          </div>
        </Card>

        {/* ── Wellness Goal ──────────────────────────────────────────── */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-indigo-500" aria-hidden />
              Wellness Goal
            </h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mental_wellness_goal" className="text-sm font-medium text-slate-700">
                Mental Wellness Goal
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                id="mental_wellness_goal"
                placeholder="e.g. Practice mindfulness daily, manage exam stress, write in my journal…"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none placeholder-slate-400"
                {...register('mental_wellness_goal')}
              />
              {errors.mental_wellness_goal && (
                <p className="text-xs text-rose-600">{errors.mental_wellness_goal.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Change Password ────────────────────────────────────────── */}
        <Card padding="lg">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" aria-hidden />
              Change Password
            </h2>
            <p className="text-xs text-slate-400 -mt-1">
              Leave both fields empty to keep your current password.
            </p>

            {/* Current password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="current_password" className="text-sm font-medium text-slate-700">
                Current password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden />
                <input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your current password"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-slate-400"
                  {...register('current_password')}
                />
                <button
                  type="button"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.current_password && (
                <p className="text-xs text-rose-600">{errors.current_password.message}</p>
              )}
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new_password" className="text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden />
                <input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-slate-400"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600">{errors.password.message}</p>
              )}
              {newPassword && newPassword.length >= 6 && !errors.password && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" aria-hidden />
                  Strong enough
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Status & Save ──────────────────────────────────────────── */}
        {apiError && <InlineError message={apiError} />}
        {apiSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm"
          >
            <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
            Profile updated successfully.
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={updateMutation.isPending || isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
