import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import LoginPage from '@/app/login/page';
import DashboardPage from '@/app/(protected)/dashboard/page';

expect.extend(toHaveNoViolations);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

describe('Accessibility Audit', () => {
  it('Login page should have no accessibility violations', async () => {
    const { container } = render(<LoginPage />, { wrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Dashboard page should have no accessibility violations', async () => {
    const { container } = render(<DashboardPage />, { wrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
