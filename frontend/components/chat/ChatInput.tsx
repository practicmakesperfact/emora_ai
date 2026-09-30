// ============================================================
// Emora AI — ChatInput Component
// The message input area with auto-grow textarea and send/stop controls
// ============================================================

import React, { useRef, useEffect } from 'react';
import { Send, StopCircle, Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn, truncate } from '@/utils';
import { CHAT_PLACEHOLDER, PRIVACY_NOTICE } from '@/constants';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Privacy reminder */}
      <div className="px-4 pb-1">
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80">
          <Info className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" aria-hidden />
          <p className="text-xs text-slate-400 leading-relaxed">
            {truncate(PRIVACY_NOTICE, 120)}
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
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
            />
          </div>

          {isStreaming ? (
            <Button
              onClick={onStop}
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
              onClick={onSend}
              disabled={!value.trim()}
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
