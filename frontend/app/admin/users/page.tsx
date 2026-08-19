// ============================================================
// Emora AI — Admin User Lookup / Management Page
// Lookup user details by ID, or delete accounts
// ============================================================

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, User, Trash2, ShieldAlert } from 'lucide-react';
import { usersApi } from '@/lib/api/users.api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { InlineError } from '@/components/common/Feedback';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/utils';
import type { User as UserType } from '@/types';

export default function AdminUsersPage() {
  const [searchId, setSearchId] = useState('');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: targetUser, isLoading, refetch } = useQuery({
    queryKey: ['admin-user-lookup', targetId],
    queryFn: () => usersApi.getUserById(targetId!),
    enabled: targetId !== null,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      setDeleteId(null);
      setTargetId(null);
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(getApiErrorMessage(err));
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const parsed = parseInt(searchId, 10);
    if (isNaN(parsed)) {
      setErrorMessage('Please enter a valid numeric User ID');
      return;
    }
    setTargetId(parsed);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Lookup specific accounts by ID to inspect roles or delete data.
        </p>
      </div>

      {/* Lookup Card */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Enter User ID"
              placeholder="e.g. 1"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button type="submit" isLoading={isLoading} className="h-10">
            Search
          </Button>
        </form>
      </Card>

      {/* Error notification */}
      {errorMessage && <InlineError message={errorMessage} />}

      {/* Target User Details */}
      {targetUser && (
        <Card padding="lg" className="space-y-4">
          <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                {targetUser.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-base">
                  {targetUser.full_name}
                </h2>
                <p className="text-xs text-slate-400">User ID #{targetUser.id}</p>
              </div>
            </div>
            <Badge variant="info">
              {targetUser.role?.name.toUpperCase() || 'USER'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Email address</span>
              <span className="font-medium text-slate-700">{targetUser.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Joined on</span>
              <span className="font-medium text-slate-700">
                {formatDateTime(targetUser.created_at)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Preferred language</span>
              <span className="font-medium text-slate-700">
                {targetUser.preferred_language.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Time zone</span>
              <span className="font-medium text-slate-700">{targetUser.time_zone}</span>
            </div>
            {targetUser.mental_wellness_goal && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Wellness Goal</span>
                <span className="font-medium text-slate-700">
                  {targetUser.mental_wellness_goal}
                </span>
              </div>
            )}
            {targetUser.emergency_contact && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Emergency Contact</span>
                <span className="font-medium text-slate-700">
                  {targetUser.emergency_contact}
                </span>
              </div>
            )}
          </div>

          {/* Delete User Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setDeleteId(targetUser.id)}
            >
              Delete User Account
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete user account?"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Are you sure you want to permanently delete user ID #{deleteId}? All
          associated chats, mood logs, and journal entries will be purged.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
