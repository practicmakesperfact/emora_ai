// ============================================================
// Emora AI — MessageBubble Component
// Renders a single chat message with Markdown, citations, crisis badge
// ============================================================

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, ExternalLink, User, Sparkles } from 'lucide-react';
import { cn, formatTime } from '@/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const citations = message.source_citations as
    | { sources?: Array<{ title?: string; source?: string }> }
    | null;

  return (
    <div className={cn('flex gap-3 items-start', isUser && 'flex-row-reverse')}>
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
              : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:text-slate-800 prose-strong:text-slate-800 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp + crisis badge */}
        <div className={cn('flex items-center gap-2 mt-1', isUser && 'flex-row-reverse')}>
          <time dateTime={message.created_at} className="text-xs text-slate-400">
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
