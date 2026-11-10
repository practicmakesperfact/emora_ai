// ============================================================
// Emora AI — Chat Conversation Window
// /chat/[conversationId] — Real SSE streaming
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Send,
  StopCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Sparkles,
  User,
  PhoneCall,
} from 'lucide-react';
import Link from 'next/link';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { LoadingPage, Skeleton } from '@/components/common/Feedback';
import { CrisisAlert, CrisisCard } from '@/components/crisis/CrisisAlert';
import { SessionLimitBanner } from '@/components/chat/SessionLimitBanner';
import { AIDisclosureCard } from '@/components/chat/AIDisclosureCard';
import { ConsentScreen, hasConsented } from '@/components/chat/ConsentScreen';
import { useSSEStream } from '@/hooks/useSSEStream';
import { formatTime, cn } from '@/utils';
import { ROUTES, CHAT_PLACEHOLDER, PRIVACY_NOTICE } from '@/constants';
import type { Message, SessionStatus, Conversation } from '@/types';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId: convIdStr } = use(params);
  const conversationId = parseInt(convIdStr, 10);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // ?crisis=mock in URL triggers the crisis card for testing without real high-risk text
  const isMockCrisis = searchParams.get('crisis') === 'mock';
  const [mockCrisisDismissed, setMockCrisisDismissed] = useState(false);

  // ── Consent gate — shown once before first ever message ───────────────────
  const [showConsent, setShowConsent] = useState(false);
  useEffect(() => {
    if (!hasConsented()) setShowConsent(true);
  }, []);

  // ── Privacy banner expand/collapse ────────────────────────────────────────
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  const [input, setInput] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestCrisis, setLatestCrisis] = useState<Message | null>(null);

  // ── Session limit state ────────────────────────────────────────────────────
  const [sessionLimitMessage, setSessionLimitMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation messages
  const { data: fetchedMessages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !isNaN(conversationId),
  });

  // Fetch conversation list to get the current title
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.listConversations({ limit: 100 }),
    enabled: !isNaN(conversationId),
  });
  const conversationTitle = (() => {
    const conv = conversations?.find((c) => c.id === conversationId);
    if (!conv || conv.title === 'New Conversation') return null;
    return conv.title;
  })();

  // Poll session status every 30 s (also refetched after each message send)
  const { data: sessionStatus } = useQuery<SessionStatus>({
    queryKey: ['session-status', conversationId],
    queryFn: () => chatApi.getSessionStatus(conversationId),
    enabled: !isNaN(conversationId),
    refetchInterval: 30_000,
    // Don't throw — silently ignore if the endpoint fails
    retry: false,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
      const crisisMsg = [...fetchedMessages]
        .reverse()
        .find((m) => m.is_crisis_triggered);
      setLatestCrisis(crisisMsg || null);
    }
  }, [fetchedMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  const streamedContentRef = useRef('');

  // SSE Stream handlers
  const handleToken = useCallback((token: string) => {
    setStreamedContent((prev) => {
      const next = prev + token;
      streamedContentRef.current = next;
      return next;
    });
  }, []);

  const handleDone = useCallback(() => {
    const finalContent = streamedContentRef.current;
    if (finalContent) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: Date.now() + 1,
          conversation_id: conversationId,
          role: 'assistant',
          content: finalContent,
          is_crisis_triggered: false,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    setStreamedContent('');
    streamedContentRef.current = '';

    // Refresh messages and session status after each exchange
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['session-status', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    textareaRef.current?.focus();
  }, [conversationId, queryClient]);

  const handleStreamError = useCallback((err: string) => {
    setStreamError(err);
    setStreamedContent('');
  }, []);

  // ── Session limit handler (429) ────────────────────────────────────────────
  const handleSessionLimit = useCallback((msg: string) => {
    setSessionLimitMessage(msg);
    setStreamedContent('');
    // Refresh session status immediately so the banner shows accurate numbers
    queryClient.invalidateQueries({ queryKey: ['session-status', conversationId] });
  }, [conversationId, queryClient]);

  const { isStreaming, startStream, cancelStream } = useSSEStream({
    onToken: handleToken,
    onDone: handleDone,
    onError: handleStreamError,
    onSessionLimit: handleSessionLimit,
  });

  // ── Prefill from /chat/new redirect (?prefill=…) — send on first render ───
  const prefillSentRef = useRef(false);
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill && !prefillSentRef.current && !isNaN(conversationId)) {
      prefillSentRef.current = true;
      const content = decodeURIComponent(prefill);
      // Optimistically add user message then stream
      const optimisticMsg: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        role: 'user',
        content,
        is_crisis_triggered: false,
        created_at: new Date().toISOString(),
      };
      setMessages([optimisticMsg]);
      startStream(conversationId, content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Determine if input should be blocked
  const isSessionBlocked =
    Boolean(sessionLimitMessage) || Boolean(sessionStatus?.is_limit_reached);

  // Send a quick-start chip as a message
  async function sendChip(text: string) {
    if (isStreaming || isSessionBlocked) return;
    setStreamError(null);
    setStreamedContent('');
    const optimisticMsg: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      role: 'user',
      content: text,
      is_crisis_triggered: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    await startStream(conversationId, text);
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || isStreaming || isSessionBlocked) return;

    setInput('');
    setStreamError(null);
    setStreamedContent('');

    // Optimistically add user message
    const optimisticMsg: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      role: 'user',
      content,
      is_crisis_triggered: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    await startStream(conversationId, content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-grow textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  if (isNaN(conversationId)) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Invalid conversation.
      </div>
    );
  }

  if (isLoading) return <LoadingPage />;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Consent gate overlay — shown once before first ever message */}
      {showConsent && (
        <ConsentScreen onAccept={() => setShowConsent(false)} />
      )}
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <Link href={ROUTES.CHAT} aria-label="Back to conversations">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {conversationTitle ?? `Conversation #${conversationId}`}
          </p>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" aria-hidden />
            <p className="text-xs text-slate-400">AI Support Assistant</p>
          </div>
        </div>

        {/* Session message counter pill — "N messages left today", amber at ≤ 5 */}
        {sessionStatus && !sessionStatus.is_limit_reached && (
          <div
            className={cn(
              'shrink-0 text-xs px-2 py-1 rounded-full font-medium',
              sessionStatus.messages_remaining <= 5
                ? 'bg-amber-100 text-amber-700 font-semibold'
                : sessionStatus.messages_remaining <= 10
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-500'
            )}
            title={`${sessionStatus.messages_remaining} messages remaining in this session`}
            role={sessionStatus.messages_remaining <= 5 ? 'alert' : undefined}
          >
            {sessionStatus.messages_remaining <= 5 && '⚠ '}
            {sessionStatus.messages_remaining} messages left today
          </div>
        )}

        {/* Persistent "Get help now" — always visible in the chat header (Step 3) */}
        <Link
          href={ROUTES.SUPPORT}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 transition-colors min-h-[36px]"
          aria-label="Get help now — crisis support"
        >
          <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Get help now</span>
        </Link>
      </div>

      {/* Mock crisis card — triggered by ?crisis=mock URL param (dev/demo only) */}
      {isMockCrisis && !mockCrisisDismissed && (
        <div className="shrink-0 px-4 pt-3">
          <CrisisCard isMock onDismiss={() => setMockCrisisDismissed(true)} />
        </div>
      )}

      {/* Crisis Alert (if applicable) */}
      {latestCrisis && (
        <div className="shrink-0 px-4 pt-3">
          <CrisisAlert message={latestCrisis} />
        </div>
      )}

      {/* Session Limit Banner */}
      {sessionStatus && (
        <div className="shrink-0 pt-2">
          <SessionLimitBanner
            status={sessionStatus}
            limitErrorMessage={sessionLimitMessage}
          />
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scroll"
        role="log"
        aria-label="Conversation messages"
        aria-live="polite"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full px-4 py-6 gap-5">
            {/* AI Transparency Disclosure — req.md §Transparency & Limits */}
            <AIDisclosureCard />

            {/* Ready-to-chat prompt */}
            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 mx-auto">
                <Sparkles className="w-5 h-5 text-indigo-500" aria-hidden />
              </div>
              <h2 className="font-semibold text-slate-700 mb-1">Ready to listen</h2>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Share whatever is on your mind. I&apos;m here to support you
                without judgment.
              </p>
            </div>

            {/* Quick-start chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {(['I feel anxious', "I can't sleep", 'Help me breathe', 'I just need to vent'] as const).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendChip(chip)}
                  disabled={isStreaming || isSessionBlocked}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border border-indigo-100 bg-indigo-50 text-indigo-600',
                    'hover:bg-indigo-100 hover:border-indigo-200 transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming AI response */}
        {isStreaming && (
          <div className="flex gap-3 items-start" aria-live="polite" aria-atomic="false">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%] lg:max-w-[680px] shadow-sm">
              {streamedContent ? (
                <div className={cn('prose-calm text-sm', /[\u1200-\u137F]/.test(streamedContent) && 'lang-am')}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamedContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex gap-1 items-center py-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="sr-only">AI is responding…</span>
                </div>
              )}
            </div>
          </div>
        )}

        {streamError && (
          <div
            role="alert"
            className="flex gap-2 items-start p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            <span>{streamError}</span>
          </div>
        )}

        <div ref={bottomRef} aria-hidden />
      </div>

      {/* Privacy reminder — 1-line summary + "Learn more" expander */}
      <div className="shrink-0 px-4 pb-1">
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80">
          <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-slate-400 leading-relaxed">
            {privacyExpanded ? PRIVACY_NOTICE : 'Your chats are stored to improve the service. Avoid sharing your full name or ID number.'}
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
        {isSessionBlocked ? (
          /* Session blocked — replace input with a clear CTA */
          <div className="max-w-3xl mx-auto rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-xs text-amber-700 mb-2">
              This session has ended. Start a new conversation to continue.
            </p>
            <Link
              href={ROUTES.CHAT}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2',
                'rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
              )}
            >
              <Sparkles className="w-4 h-4" aria-hidden />
              New conversation
            </Link>
          </div>
        ) : (
          <div className="flex gap-2 items-end max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <label htmlFor="chat-input" className="sr-only">
                Type your message
              </label>
              <textarea
                id="chat-input"
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={CHAT_PLACEHOLDER}
                disabled={isStreaming || isSessionBlocked}
                rows={1}
                aria-disabled={isStreaming || isSessionBlocked}
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

            {isStreaming ? (
              <Button
                onClick={cancelStream}
                variant="outline"
                size="md"
                leftIcon={<StopCircle className="w-4 h-4" />}
                aria-label="Stop AI response"
                className="shrink-0 h-12"
              >
                Stop
              </Button>
            ) : (
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isSessionBlocked}
                size="md"
                leftIcon={<Send className="w-4 h-4" />}
                aria-label="Send message"
                className="shrink-0 h-12"
              >
                Send
              </Button>
            )}
          </div>
        )}
        <p className="text-center text-xs text-slate-400 mt-2">
          {isSessionBlocked
            ? 'Session ended · Start a new conversation above'
            : 'Press Enter to send · Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const citations = message.source_citations as
    | { sources?: Array<{ title?: string; source?: string }> }
    | null;

  // Detect Amharic content to apply correct font and line-height
  const hasAmharic = /[\u1200-\u137F]/.test(message.content);

  return (
    <div
      className={cn('flex gap-3 items-start', isUser && 'flex-row-reverse')}
    >
      {/* Avatar + AI label */}
      <div className={cn('flex flex-col items-center gap-1 shrink-0', isUser && 'order-last')}>
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isUser ? 'bg-slate-200' : 'bg-indigo-600'
          )}
          aria-hidden
        >
          {isUser ? (
            <User className="w-4 h-4 text-slate-600" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
        {/* Transparency label — only on AI messages (req.md §Transparency) */}
        {!isUser && (
          <span className="text-[9px] font-semibold text-indigo-400 tracking-wide uppercase leading-none">
            AI
          </span>
        )}
      </div>

      <div className={cn('flex flex-col max-w-[70%] lg:max-w-[680px]', isUser && 'items-end')}>
        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm shadow-sm',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm prose-calm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className={hasAmharic ? 'lang-am' : undefined}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp + crisis badge */}
        <div className={cn('flex items-center gap-2 mt-1', isUser && 'flex-row-reverse')}>
          <time
            dateTime={message.created_at}
            className="text-xs text-slate-500"
          >
            {formatTime(message.created_at)}
          </time>
          {message.is_crisis_triggered && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" aria-hidden />
              Support note
            </span>
          )}
        </div>

        {/* Source Citations (RAG) — only from backend */}
        {!isUser && citations?.sources && citations.sources.length > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" aria-hidden />
              Sources
            </p>
            <ul className="space-y-1">
              {citations.sources.map((src, i) => (
                <li key={i} className="text-xs text-indigo-600">
                  {src.title || src.source || 'Resource'}
                  {src.source && src.title && (
                    <span className="text-indigo-400"> · {src.source}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
