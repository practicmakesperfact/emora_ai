// ============================================================
// Emora AI — Chat Conversation Window
// /chat/[conversationId] — Real SSE streaming
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import Link from 'next/link';
import { chatApi } from '@/lib/api/chat.api';
import { Button } from '@/components/common/Button';
import { LoadingPage, Skeleton } from '@/components/common/Feedback';
import { CrisisAlert } from '@/components/crisis/CrisisAlert';
import { useSSEStream } from '@/hooks/useSSEStream';
import { formatTime, cn, truncate } from '@/utils';
import { ROUTES, CHAT_PLACEHOLDER, PRIVACY_NOTICE } from '@/constants';
import type { Message } from '@/types';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId: convIdStr } = use(params);
  const conversationId = parseInt(convIdStr, 10);
  const queryClient = useQueryClient();

  const [input, setInput] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestCrisis, setLatestCrisis] = useState<Message | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation messages
  const { data: fetchedMessages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !isNaN(conversationId),
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
      // Check for most recent crisis
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

  // SSE Stream
  const handleToken = useCallback((token: string) => {
    setStreamedContent((prev) => prev + token);
  }, []);

  const handleDone = useCallback(() => {
    setStreamedContent('');
    // Refresh messages to get the saved AI response
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    textareaRef.current?.focus();
  }, [conversationId, queryClient]);

  const handleStreamError = useCallback((err: string) => {
    setStreamError(err);
    setStreamedContent('');
  }, []);

  const { isStreaming, startStream, cancelStream } = useSSEStream({
    onToken: handleToken,
    onDone: handleDone,
    onError: handleStreamError,
  });

  async function sendMessage() {
    const content = input.trim();
    if (!content || isStreaming) return;

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
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
        <Link href={ROUTES.CHAT} aria-label="Back to conversations">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            Conversation #{conversationId}
          </p>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" aria-hidden />
            <p className="text-xs text-slate-400">AI Support Assistant</p>
          </div>
        </div>
      </div>

      {/* Crisis Alert (if applicable) */}
      {latestCrisis && (
        <div className="shrink-0 px-4 pt-3">
          <CrisisAlert message={latestCrisis} />
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
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-500" aria-hidden />
            </div>
            <h2 className="font-semibold text-slate-700 mb-1">
              Ready to listen
            </h2>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Share whatever is on your mind. I&apos;m here to support you
              without judgment.
            </p>
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
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm">
              {streamedContent ? (
                <div className="prose-calm text-sm">
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

      {/* Privacy reminder */}
      <div className="shrink-0 px-4 pb-1">
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80">
          <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-slate-400 leading-relaxed">
            {truncate(PRIVACY_NOTICE, 120)}
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 pb-4 pt-2 bg-white border-t border-slate-100">
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
              disabled={isStreaming}
              rows={1}
              aria-disabled={isStreaming}
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
              disabled={!input.trim()}
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              aria-label="Send message"
              className="shrink-0 h-12"
            >
              Send
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-slate-300 mt-2">
          Press Enter to send · Shift+Enter for new line
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

  return (
    <div
      className={cn('flex gap-3 items-start', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
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

      <div className={cn('flex flex-col max-w-[80%]', isUser && 'items-end')}>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp + crisis badge */}
        <div className={cn('flex items-center gap-2 mt-1', isUser && 'flex-row-reverse')}>
          <time
            dateTime={message.created_at}
            className="text-xs text-slate-400"
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
