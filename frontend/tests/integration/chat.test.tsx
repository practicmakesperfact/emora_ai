import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatPage from '@/app/(protected)/chat/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Chat Page Integration', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ChatPage />, { wrapper });
    // Assuming LoadingPage has a spin animation or specific test id, we check for main heading absence
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
  });

  it('renders conversations list when data is loaded', async () => {
    server.use(
      http.get('*/chat', () => {
        return HttpResponse.json([
          { id: 1, title: 'Session 1', updated_at: new Date().toISOString() },
        ]);
      })
    );

    render(<ChatPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });
  });

  it('renders empty state when no conversations exist', async () => {
    server.use(
      http.get('*/chat', () => {
        return HttpResponse.json([]);
      })
    );

    render(<ChatPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });
  });

  it('creates new conversation on button click', async () => {
    server.use(
      http.get('*/chat', () => HttpResponse.json([])),
      http.post('*/chat', () => HttpResponse.json({ id: 99, title: 'New Chat' }))
    );

    render(<ChatPage />, { wrapper });

    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument());

    const buttons = screen.getAllByRole('button', { name: /Start New Session/i });
    fireEvent.click(buttons[0]); // Header button or empty state button

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat/99');
    });
  });
});
