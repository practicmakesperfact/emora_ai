// ============================================================
// Emora AI — New Chat Page (/chat/new)
// Step 7: Conversation is NOT created in DB until first message is sent.
//         On send: create conversation → redirect to /chat/{id} → send message.
// ============================================================

'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Info, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { AIDisclosureCard } from '@/components/chat/AIDisclosureCard';
import { ConsentScreen, hasConsented } from '@/components/chat/ConsentScreen';
import { useSSEStream } from '@/hooks/useSSEStream';
import { cn } from '@/utils';
import { ROUTES, CHAT_PLACEHOLDER } from '@/constants';

// Quick-start prompt chips (Step 8 — added here too for the empty state)
const QUICK_CHIPS = [
  "I feel anxious",
  "I can't sleep",
  "Help me breathe",
  "I just need to vent",
];

export default function NewChatPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Consent gate
  const [showConsent, setShowConsent] = useState(false);
  useEffect(() => {
    if (!hasConsented()) setShowConsent(true);
  }, []);

  // Privacy banner expand
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  // SSE stream — only used AFTER we redirect to the real conversation page.
  // Here we just need to create the conversation and navigate.
  const { isStreaming } = useSSEStream({
    onToken: () => {},
    onDone: () => {},
    onError: () => {},
  });

  async function handleSend(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isSending || isStreaming) return;

    setIsSending(true);
    setError(null);

    try {
      // 1. Create conversation now (first real message)
      const conv = await chatApi.createConversation({ title: 'New Conversation' });
      // 2. Navigate to the real conversation page — it will send the message via SSE
      router.push(`/chat/${conv.id}?prefill=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start conversation. Please try again.');
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Consent gate */}
      {showConsent && <ConsentScreen onAccept={() => setShowConsent(false)} />}

      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <Link href={ROUTES.CHAT} aria-label="Back to conversations">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">New Conversation</p>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" aria-hidden />
            <p className="text-xs text-slate-400">AI Support Assistant</p>
          </div>
        </div>
        <Link
          href={ROUTES.SUPPORT}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-colors min-h-[36px]"
          aria-label="Get help now — crisis support"
        >
          <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Get help now</span>
        </Link>
      </div>

      {/* Empty state with AIDisclosureCard + quick chips */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center h-full px-4 py-6 gap-5">
          <AIDisclosureCard />
          <div className="text-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 mx-auto">
              <Sparkles className="w-5 h-5 text-indigo-500" aria-hidden />
            </div>
            <h2 className="font-semibold text-slate-700 mb-1">Ready to listen</h2>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Share whatever is on your mind. I&apos;m here to support you without judgment.
            </p>
          </div>

          {/* Quick-start chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isSending}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border border-indigo-100 bg-indigo-50 text-indigo-600',
                  'hover:bg-indigo-100 hover:border-indigo-200 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 px-4 pb-1">
          <p className="text-xs text-rose-600 text-center">{error}</p>
        </div>
      )}

      {/* Privacy reminder */}
      <div className="shrink-0 px-4 pb-1">
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80">
          <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-slate-400 leading-relaxed">
            {privacyExpanded
              ? 'Your chats are stored to improve the service. The AI runs on Groq\'s servers. Avoid sharing your full name or ID number. No data is sold or shared with advertisers.'
              : 'Your chats are stored to improve the service. Avoid sharing your full name or ID number.'}
            {' '}
            <button
              type="button"
              onClick={() => setPrivacyExpanded((v) => !v)}
              className="text-indigo-400 hover:text-indigo-600 underline focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
            >
              {privacyExpanded ? 'Show less' : 'Learn more'}
            </button>
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 pb-4 pt-2 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <label htmlFor="new-chat-input" className="sr-only">Type your message</label>
            <textarea
              id="new-chat-input"
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={CHAT_PLACEHOLDER}
              disabled={isSending}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400',
                'disabled:bg-slate-50 disabled:cursor-not-allowed',
                'border-slate-200 hover:border-slate-300',
                'min-h-[48px] max-h-[160px] overflow-y-auto'
              )}
              style={{ height: 'auto' }}
            />
          </div>
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isSending}
            isLoading={isSending}
            size="md"
            leftIcon={<Send className="w-4 h-4" />}
            aria-label="Send message"
            className="shrink-0 h-12"
          >
            Send
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
