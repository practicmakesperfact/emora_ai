// ============================================================
// Emora AI — Settings Page (/settings)
// ============================================================

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, MapPin, Shield, Eye, HelpCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usersApi } from '@/lib/api/users.api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { InlineError } from '@/components/common/Feedback';
import { profileSchema, type ProfileFormData } from '@/schemas';
import { getErrorMessage } from '@/utils';
import { LANGUAGES } from '@/constants';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emora_reduced_motion') === 'true';
      setReducedMotion(saved);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      preferred_language: user?.preferred_language || 'en',
      time_zone: user?.time_zone || 'UTC',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      return usersApi.updateMe({
        preferred_language: data.preferred_language,
        time_zone: data.time_zone,
      });
    },
    onSuccess: async () => {
      setApiSuccess(true);
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setTimeout(() => setApiSuccess(false), 3000);
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  function handleReducedMotionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const active = e.target.checked;
    setReducedMotion(active);
    localStorage.setItem('emora_reduced_motion', String(active));
    if (active) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Customize your preferences and accessibility choices.
        </p>
      </div>

      <Card padding="lg">
        <form
          onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
          noValidate
          aria-label="Application settings form"
        >
          <div className="space-y-6">
            {/* Regional & Language Settings */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" aria-hidden />
                Language & Region
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="preferred_language"
                    className="text-sm font-medium text-slate-700"
                  >
                    Preferred Language
                  </label>
                  <select
                    id="preferred_language"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    {...register('preferred_language')}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
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

            {/* Accessibility Settings */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" aria-hidden />
                Accessibility
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={handleReducedMotionChange}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">
                      Reduce Motion
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Minimize screen animations, transitions, and hover motion
                      effects to prevent visual fatigue.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Security Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" aria-hidden />
                Privacy & Data
              </h2>
              <div className="flex gap-2.5 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Emora is built with your confidentiality in mind. Your
                  conversations and logs are encrypted at rest on the local host.
                  We do not share your logs with third-party networks except for
                  local RAG document matching.
                </p>
              </div>
            </div>

            {/* Status alerts */}
            {apiError && <InlineError message={apiError} />}
            {apiSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
                Preferences updated successfully.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={updateMutation.isPending || isSubmitting}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
