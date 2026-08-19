// ============================================================
// Emora AI — useSSEStream Hook
// Handles Server-Sent Events streaming from FastAPI backend
// ============================================================

import { useCallback, useRef, useState } from 'react';

interface UseSSEStreamOptions {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
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
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                onDone();
                setIsStreaming(false);
                return;
              }
              if (data) {
                onToken(data);
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
    [onToken, onDone, onError]
  );

  return { isStreaming, startStream, cancelStream };
}
