// ============================================================
// Emora AI — Chat Page (/chat)
// Redirects to /chat/new for a fresh conversation
// ============================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat/new');
  }, [router]);

  return null;
}
