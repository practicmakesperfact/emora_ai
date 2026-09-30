import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MoodPage from '@/app/(protected)/mood/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Mood Page Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders empty state when no mood history exists', async () => {
    server.use(
      http.get('*/mood/history', () => HttpResponse.json([])),
      http.get('*/mood/trends', () => HttpResponse.json({
        summary: { average_score: 0, total_logs: 0 },
        daily_averages: []
      }))
    );

    render(<MoodPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No mood logs for this period')).toBeInTheDocument();
    });
  });

  it('renders mood history list and trends', async () => {
    server.use(
      http.get('*/mood/history', () => HttpResponse.json([
        { id: 1, score: 8, emotions: ['happy'], created_at: new Date().toISOString() }
      ])),
      http.get('*/mood/trends', () => HttpResponse.json({
        summary: { average_score: 8, total_logs: 1 },
        daily_averages: [{ date: '2023-01-01', average_score: 8, count: 1 }]
      }))
    );

    render(<MoodPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Very good')).toBeInTheDocument(); // label for 8
      expect(screen.getByText('happy')).toBeInTheDocument();
    });
  });

  it('opens log mood modal when button clicked', async () => {
    server.use(
      http.get('*/mood/history', () => HttpResponse.json([])),
      http.get('*/mood/trends', () => HttpResponse.json({
        summary: { average_score: 0, total_logs: 0 },
        daily_averages: []
      }))
    );

    render(<MoodPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No mood logs for this period')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /Log Mood/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('How are you feeling right now?')).toBeInTheDocument();
    });
  });
});
