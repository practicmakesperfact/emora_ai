// ============================================================
// Emora AI — Settings Page (/settings)
// Step 11: Added "Export my data" + "Delete my account" sections
//          at the bottom of the Privacy & Data card.
// ============================================================

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, MapPin, Shield, Eye, HelpCircle, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usersApi } from '@/lib/api/users.api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { InlineError } from '@/components/common/Feedback';
import { getErrorMessage } from '@/utils';
import { LANGUAGES } from '@/constants';

// Local schema for settings (language + timezone only)
const settingsSchema = z.object({
  preferred_language: z.string().max(10).optional(),
  time_zone: z.string().max(50).optional(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // ── Export state ──────────────────────────────────────────────────────────
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ── Delete account state ──────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emora_reduced_motion') === 'true';
      // eslint-disable-next-line
      setReducedMotion(saved);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      preferred_language: user?.preferred_language || 'en',
      time_zone: user?.time_zone || 'Africa/Addis_Ababa',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormData) => {
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

  // ── Export mutation ───────────────────────────────────────────────────────
  const exportMutation = useMutation({
    mutationFn: () => usersApi.exportMyData(),
    onSuccess: (blob: Blob) => {
      // Trigger browser file download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emora_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    },
    onError: (err) => setExportError(getErrorMessage(err)),
  });

  // ── Delete account mutation ───────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => usersApi.deleteMyAccount(),
    onSuccess: () => {
      // Sign out and redirect to login — backend has already deleted the account
      logout();
    },
    onError: (err) => setDeleteError(getErrorMessage(err)),
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

  const deleteConfirmValid = deleteConfirmText.trim() === 'DELETE';

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

            {/* Privacy & Data */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" aria-hidden />
                Privacy & Data
              </h2>
              <div className="flex gap-2.5 items-start p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your conversations are stored in a local PostgreSQL database on this server.
                  The AI model (Llama via Groq API) processes your messages on Groq&apos;s servers —
                  messages are sent there for each response.
                  Uploaded documents for RAG are stored locally and embedded via Ollama (runs on this server).
                  No data is shared with third-party advertising or analytics services.
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

      {/* ── Data Rights Card ───────────────────────────────────────────────── */}
      <Card padding="lg">
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" aria-hidden />
            Your Data Rights
          </h2>

          {/* Export My Data */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Export my data</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Download a copy of everything Emora holds about you: your profile,
                all conversations, mood logs, and journal entries — as a JSON file.
              </p>
            </div>
            {exportError && <InlineError message={exportError} />}
            {exportSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">
                Your data export has started downloading.
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
              isLoading={exportMutation.isPending}
              onClick={() => {
                setExportError(null);
                exportMutation.mutate();
              }}
            >
              Export my data
            </Button>
          </div>

          {/* Delete My Account */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Delete my account and all data</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Permanently deletes your Emora account, all conversations and messages, mood logs,
                and journal entries. <strong className="text-slate-700">This action cannot be undone.</strong>
              </p>
            </div>

            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="danger"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete my account
              </Button>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm text-rose-800 font-medium">
                    This will permanently delete your account and all data. There is no recovery.
                  </p>
                </div>
                <p className="text-xs text-rose-700">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  aria-label="Type DELETE to confirm account deletion"
                  className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
                {deleteError && <InlineError message={deleteError} />}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeleteError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={!deleteConfirmValid}
                    isLoading={deleteMutation.isPending}
                    onClick={() => {
                      if (deleteConfirmValid) {
                        setDeleteError(null);
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    Delete permanently
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
