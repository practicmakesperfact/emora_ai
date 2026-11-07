// ============================================================
// Emora AI — useSSEStream Hook
// Handles Server-Sent Events streaming from FastAPI backend.
// Detects HTTP 429 (session limit) and surfaces it via onSessionLimit.
// ============================================================

import { useCallback, useRef, useState } from 'react';

interface UseSSEStreamOptions {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  /** Called when the backend returns HTTP 429 (session limit reached). */
  onSessionLimit?: (message: string) => void;
}

interface UseSSEStreamReturn {
  isStreaming: boolean;
  startStream: (conversationId: number, content: string) => Promise<void>;
  cancelStream: () => void;
}

export function useSSEStream({
  onToken,
  onDone,
  onError,
  onSessionLimit,
}: UseSSEStreamOptions): UseSSEStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (conversationId: number, content: string) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('emora_access_token')
          : null;

      if (!token) {
        onError('You are not authenticated. Please log in again.');
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch(
          `${baseUrl}/chat/${conversationId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));

          // ── Session limit hit (HTTP 429) ───────────────────────────
          if (response.status === 429) {
            const msg =
              err?.error ||
              'You have reached the session limit. Please start a new conversation.';
            if (onSessionLimit) {
              onSessionLimit(msg);
            } else {
              onError(msg);
            }
            return;
          }

          throw new Error(
            err?.error || "We're having trouble sending your message right now."
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body available.');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trimStart();
            if (trimmedLine.startsWith('data: ')) {
              const rawData = trimmedLine.slice(6);
              if (rawData === '[DONE]') {
                onDone();
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(rawData);
                if (parsed.done) {
                  onDone();
                  setIsStreaming(false);
                  return;
                }
                if (typeof parsed.token === 'string') {
                  onToken(parsed.token);
                  continue;
                }
              } catch {
                // Fallback for raw text token
                if (rawData) {
                  onToken(rawData);
                }
              }
            }
          }
        }

        onDone();
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          // User cancelled — not an error
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "We're having trouble with your request. Please try again.";
        onError(message);
      } finally {
        setIsStreaming(false);
      }
    },
    [onToken, onDone, onError, onSessionLimit]
  );

  return { isStreaming, startStream, cancelStream };
}
