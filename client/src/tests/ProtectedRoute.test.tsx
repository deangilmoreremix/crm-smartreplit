import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const mockUseAuth = vi.fn();
const mockEntitlementContext = {
  entitlement: null as any,
  isLoading: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../contexts/EntitlementContext', () => ({
  EntitlementContext: {
    Consumer: ({ children }: { children: (ctx: typeof mockEntitlementContext) => React.ReactNode }) =>
      children(mockEntitlementContext),
  },
  useEntitlements: () => mockEntitlementContext,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEntitlementContext.entitlement = null;
    mockEntitlementContext.isLoading = false;
  });

  it('shows loading spinner while session is not ready', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isSessionReady: false,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
  });

  it('shows loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isSessionReady: true,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      loading: false,
      isSessionReady: true,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when on signin or signup page even without auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isSessionReady: true,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/signin']}>
        <Routes>
          <Route path="/signin" element={<ProtectedRoute><div>Sign In Page</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });

  it('redirects to signin when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isSessionReady: true,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>} />
          <Route path="/signin" element={<div>Sign In</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('redirects to upgrade when user lacks feature access', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      loading: false,
      isSessionReady: true,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/ai-tools']}>
        <Routes>
          <Route path="/ai-tools" element={<ProtectedRoute featureKey="ai_tools"><div>AI Tools</div></ProtectedRoute>} />
          <Route path="/upgrade" element={<div>Upgrade Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Upgrade Page')).toBeInTheDocument();
  });

  it('shows loading spinner while entitlements are loading', () => {
    mockEntitlementContext.isLoading = true;
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      loading: false,
      isSessionReady: true,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute featureKey="ai_tools">
          <div>AI Tools</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking feature access...')).toBeInTheDocument();
  });

  it('allows access when user has required feature entitlement', () => {
    mockEntitlementContext.entitlement = { package: 'smartmarketer' };
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com' },
      loading: false,
      isSessionReady: true,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute featureKey="ai_tools">
          <div>AI Tools</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('AI Tools')).toBeInTheDocument();
  });
});
