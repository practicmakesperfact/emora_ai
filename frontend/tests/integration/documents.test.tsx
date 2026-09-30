import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDocumentsPage from '@/app/admin/documents/page';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Documents Page Integration', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders empty state when no documents exist', async () => {
    server.use(
      http.get('*/documents', () => HttpResponse.json([]))
    );

    render(<AdminDocumentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
    });
  });

  it('renders documents when data exists', async () => {
    server.use(
      http.get('*/documents', () => HttpResponse.json([
        {
          id: 1,
          title: 'CBT Handbook',
          file_name: 'cbt_guide.pdf',
          status: 'processed',
          upload_date: new Date().toISOString()
        }
      ]))
    );

    render(<AdminDocumentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('CBT Handbook')).toBeInTheDocument();
      expect(screen.getByText('cbt_guide.pdf')).toBeInTheDocument();
      expect(screen.getByText('Indexed')).toBeInTheDocument();
    });
  });

  it('handles delete action', async () => {
    server.use(
      http.get('*/documents', () => HttpResponse.json([
        {
          id: 1,
          title: 'CBT Handbook',
          file_name: 'cbt_guide.pdf',
          status: 'processed',
          upload_date: new Date().toISOString()
        }
      ]))
    );

    render(<AdminDocumentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('CBT Handbook')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete document: CBT Handbook/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText('Delete document?')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    });
  });
});
