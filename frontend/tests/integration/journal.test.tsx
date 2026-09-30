import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JournalPage from '@/app/(protected)/journal/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Journal Page Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders empty state when no journals exist', async () => {
    server.use(
      http.get('*/journal/history', () => HttpResponse.json([]))
    );

    render(<JournalPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No journal entries yet')).toBeInTheDocument();
    });
  });

  it('renders journal entries when data exists', async () => {
    server.use(
      http.get('*/journal/history', () => HttpResponse.json([
        {
          id: 1,
          content: 'Today was a good day.',
          ai_summary: 'Positive reflection on the day.',
          emotions: ['content'],
          created_at: new Date().toISOString()
        }
      ]))
    );

    render(<JournalPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Today was a good day.')).toBeInTheDocument();
      expect(screen.getByText('Positive reflection on the day.')).toBeInTheDocument();
    });
  });

  it('opens write entry modal when button clicked', async () => {
    server.use(
      http.get('*/journal/history', () => HttpResponse.json([]))
    );

    render(<JournalPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No journal entries yet')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /Write (Entry|Your First Entry)/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('New Journal Entry')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reflect on your thoughts/i)).toBeInTheDocument();
    });
  });
});
