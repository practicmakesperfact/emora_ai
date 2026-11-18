// ============================================================
// Emora AI — API Health Check Component
// Temporary diagnostic tool to verify backend connectivity
// Usage: Add <ApiHealthCheck /> to any page to see API status
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  isHealthy: boolean;
  message: string;
  apiUrl: string;
  error?: string;
}

export function ApiHealthCheck() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function checkHealth() {
    setIsChecking(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    try {
      const response = await fetch(`${apiUrl.replace('/api/v1', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          isHealthy: true,
          message: `Backend is running (${data.status})`,
          apiUrl,
        });
      } else {
        setStatus({
          isHealthy: false,
          message: `Backend returned ${response.status}`,
          apiUrl,
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      setStatus({
        isHealthy: false,
        message: 'Cannot connect to backend',
        apiUrl,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        className={`rounded-xl border p-4 shadow-lg ${
          status.isHealthy
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {status.isHealthy ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              status.isHealthy ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              {status.message}
            </p>
            <p className="text-xs text-slate-500 mt-1 break-all">{status.apiUrl}</p>
            {status.error && (
              <p className="text-xs text-rose-600 mt-1 font-mono">{status.error}</p>
            )}
            {!status.isHealthy && (
              <p className="text-xs text-rose-700 mt-2">
                Start the backend: <code className="bg-rose-100 px-1 rounded">uvicorn app.main:app --reload</code>
              </p>
            )}
          </div>

          <button
            onClick={checkHealth}
            disabled={isChecking}
            className={`text-xs px-2 py-1 rounded ${
              status.isHealthy
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            } transition-colors disabled:opacity-50`}
          >
            {isChecking ? 'Checking...' : 'Retry'}
          </button>
        </div>
      </div>
    </div>
  );
}
