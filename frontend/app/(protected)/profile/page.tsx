// ============================================================
// Emora AI — Profile Page (/profile)
// ============================================================

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, Mail, Globe, MapPin, Heart, Phone, Shield } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usersApi } from '@/lib/api/users.api';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { InlineError } from '@/components/common/Feedback';
import { profileSchema, type ProfileFormData } from '@/schemas';
import { getErrorMessage } from '@/utils';
import { LANGUAGES } from '@/constants';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      preferred_language: user?.preferred_language || 'en',
      time_zone: user?.time_zone || 'UTC',
      mental_wellness_goal: user?.mental_wellness_goal || '',
      emergency_contact: user?.emergency_contact || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      // Filter out empty password or wellness goals if unmodified
      const payload: Record<string, any> = { ...data };
      if (!payload.password) delete payload.password;
      return usersApi.updateMe(payload);
    },
    onSuccess: async () => {
      setApiSuccess(true);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => setApiSuccess(false), 3000);
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
          Manage your personal settings, emergency contacts, and wellness goals.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Update profile form">
          <div className="space-y-5">
            {/* Account info section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
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

            {/* Language/Timezone section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
                Preferences
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="preferred_language" className="text-sm font-medium text-slate-700">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden />
                    <select
                      id="preferred_language"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      {...register('preferred_language')}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Time Zone"
                  type="text"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  error={errors.time_zone?.message}
                  {...register('time_zone')}
                />
              </div>
            </div>

            {/* Goals & Support section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
                Wellness & Support
              </h2>
              <Input
                label="Emergency Contact"
                type="text"
                placeholder="Name, relationship, phone number…"
                hint="In case of emergency, who should you or counselor contact?"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.emergency_contact?.message}
                {...register('emergency_contact')}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mental_wellness_goal" className="text-sm font-medium text-slate-700">
                  Mental Wellness Goal
                </label>
                <div className="relative">
                  <Heart className="absolute left-3 top-3 text-slate-400 w-4 h-4" aria-hidden />
                  <textarea
                    id="mental_wellness_goal"
                    placeholder="e.g. Practicing mindfulness, managing stress, writing in journal daily…"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                    {...register('mental_wellness_goal')}
                  />
                </div>
                {errors.mental_wellness_goal && (
                  <p className="text-xs text-rose-600">{errors.mental_wellness_goal.message}</p>
                )}
              </div>
            </div>

            {/* Security change password section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
                Security
              </h2>
              <Input
                label="New Password"
                type="password"
                placeholder="Leave blank to keep current"
                hint="At least 6 characters"
                leftIcon={<Shield className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Notifications */}
            {apiError && <InlineError message={apiError} />}
            {apiSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
                Profile updated successfully.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={updateMutation.isPending || isSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
