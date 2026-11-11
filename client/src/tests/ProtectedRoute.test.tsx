import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { EntitlementContext } from '../contexts/EntitlementContext';

const mockUseAuth = vi.fn();
const mockEntitlementContext = {
  entitlement: null as any,
  isLoading: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ProtectedRoute reads the entitlements with useContext(EntitlementContext), so the mocked
// module must export a real React context (a stub object with a Consumer is not enough: the
// component would then never see isLoading/entitlement, fall through to <Navigate>, and - when
// rendered outside <Routes> - redirect in an endless loop).
vi.mock('../contexts/EntitlementContext', async () => {
  const { createContext } = await import('react');
  const EntitlementContext = createContext<any>(undefined);
  return {
    EntitlementContext,
    useEntitlements: () => mockEntitlementContext,
  };
});

// Provide the current mock entitlement state to whatever is rendered
const renderWithEntitlements = (ui: React.ReactElement) =>
  render(
    <EntitlementContext.Provider value={mockEntitlementContext as any}>{ui}</EntitlementContext.Provider>
  );

describe('ProtectedRoute', { timeout: 10000 }, () => {
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
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

    renderWithEntitlements(
      <MemoryRouter>
        <ProtectedRoute featureKey="ai_tools">
          <div>AI Tools</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('AI Tools')).toBeInTheDocument();
  });
});
