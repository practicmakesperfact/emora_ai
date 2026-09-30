import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CounselorIncidentsPage from '@/app/counselor/incidents/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Crisis Page Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders empty state when no incidents exist', async () => {
    server.use(
      http.get('*/crisis/incidents', () => HttpResponse.json([]))
    );

    render(<CounselorIncidentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No active incidents')).toBeInTheDocument();
    });
  });

  it('renders incidents when data exists', async () => {
    server.use(
      http.get('*/crisis/incidents', () => HttpResponse.json([
        {
          id: 1,
          user_id: 1,
          message_content: 'I want to hurt myself',
          risk_level: 'critical',
          action_taken: 'flagged',
          resolved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]))
    );

    render(<CounselorIncidentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('I want to hurt myself')).toBeInTheDocument();
      expect(screen.getByText('Critical Risk')).toBeInTheDocument();
    });
  });

  it('opens resolve modal when button clicked', async () => {
    server.use(
      http.get('*/crisis/incidents', () => HttpResponse.json([
        {
          id: 1,
          user_id: 1,
          message_content: 'I want to hurt myself',
          risk_level: 'critical',
          action_taken: 'flagged',
          resolved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]))
    );

    render(<CounselorIncidentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('I want to hurt myself')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /Mark Resolved/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Resolve Incident')).toBeInTheDocument();
      expect(screen.getByLabelText(/Counselor Notes/i)).toBeInTheDocument();
    });
  });
});
