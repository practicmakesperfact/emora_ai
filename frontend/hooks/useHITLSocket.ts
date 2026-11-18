/**
 * useHITLSocket — Counselor real-time crisis alert hook
 *
 * Connects to the backend WebSocket at:
 *   ws://HOST/api/v1/crisis/ws?token=<jwt>
 *
 * Features:
 *  - Authenticates via JWT stored in localStorage
 *  - Auto-reconnects after a 3-second delay on drop
 *  - Accumulates incoming alerts (max 20 kept in memory)
 *  - Exposes connection status for UI feedback
 *  - Sends a periodic ping every 30 s to keep the connection alive
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ── Types ─────────────────────────────────────────────────────────────────

export type HITLConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';

export interface HITLAlert {
  /** Discriminator — always "new_incident" for now */
  type: 'new_incident';
  /** Backend incident primary key */
  incident_id: number;
  /** User who triggered the crisis */
  user_id: number;
  /** "High" | "Critical" */
  risk_level: string;
  /** Truncated to 120 chars by the backend */
  message_preview: string;
  /** May be null if the message was outside a conversation */
  conversation_id: number | null;
  /** ISO-8601 timestamp */
  created_at: string;
  /** Client-side UUID used as React key */
  id: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = 'emora_access_token';
const MAX_ALERTS = 20;
const RECONNECT_DELAY_MS = 3_000;
const PING_INTERVAL_MS = 30_000;

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseHITLSocketReturn {
  alerts: HITLAlert[];
  status: HITLConnectionStatus;
  clearAlerts: () => void;
  dismissAlert: (id: string) => void;
}

export function useHITLSocket(): UseHITLSocketReturn {
  const [alerts, setAlerts] = useState<HITLAlert[]>([]);
  const [status, setStatus] = useState<HITLConnectionStatus>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const token =
      typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

    if (!token) {
      // No token yet — not logged in or token hasn't been stored. Wait.
      setStatus('closed');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).host
      : 'localhost:8000';
    const url = `${protocol}://${host}/api/v1/crisis/ws?token=${encodeURIComponent(token)}`;

    setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setStatus('connected');

      // Start keep-alive pings
      pingTimerRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const raw = JSON.parse(event.data as string);
        if (raw.type === 'new_incident') {
          const alert: HITLAlert = { ...raw, id: uuidv4() };
          setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
        }
      } catch {
        // Non-JSON frame — ignore
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      clearInterval(pingTimerRef.current ?? undefined);
      pingTimerRef.current = null;

      setStatus('reconnecting');
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connect();
      }, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      // onerror is always followed by onclose, so let onclose handle reconnect
      ws.close();
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current ?? undefined);
      clearInterval(pingTimerRef.current ?? undefined);
      wsRef.current?.close();
    };
  }, [connect]);

  return { alerts, status, clearAlerts, dismissAlert };
}
