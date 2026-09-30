// ============================================================
// Emora AI — WelcomeCard Component
// Dashboard greeting with quick actions
// ============================================================

import React from 'react';
import Link from 'next/link';
import { MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/constants';
import type { User } from '@/types';

interface WelcomeCardProps {
  user: User | null;
  onNewChat: () => void;
  isCreatingChat: boolean;
}

export function WelcomeCard({ user, onNewChat, isCreatingChat }: WelcomeCardProps) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-2">
          Hello, {firstName}.
        </h2>
        <p className="text-indigo-100 mb-8 max-w-md leading-relaxed">
          How are you feeling today? I&apos;m here to listen, support, and help you reflect whenever you&apos;re ready.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={onNewChat}
            isLoading={isCreatingChat}
            size="lg"
            className="bg-white text-indigo-600 hover:bg-slate-50 focus-visible:ring-white border-0 shadow-sm"
            leftIcon={<MessageCircle className="w-5 h-5" />}
          >
            Start a Conversation
          </Button>

          <Link href={ROUTES.JOURNAL}>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 focus-visible:ring-white"
              leftIcon={<BookOpen className="w-5 h-5" />}
            >
              Write Journal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
