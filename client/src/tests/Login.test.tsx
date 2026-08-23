import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Auth/Login';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('../../lib/supabase', () => ({
  auth: {
    signIn: vi.fn(),
  },
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithRouter(<Login />);

    expect(screen.getByText('Smart CRM')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    const { auth } = await import('../../lib/supabase');
    vi.mocked(auth.signIn).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls auth.signIn with correct credentials', async () => {
    const { auth } = await import('../../lib/supabase');
    vi.mocked(auth.signIn).mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    });

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(auth.signIn).toHaveBeenCalledWith('user@test.com', 'secret123');
    });
  });

  it('navigates to dashboard on successful login', async () => {
    const { auth } = await import('../../lib/supabase');
    vi.mocked(auth.signIn).mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    });

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows loading state during login', async () => {
    const { auth } = await import('../../lib/supabase');
    vi.mocked(auth.signIn).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('has link to signup page', () => {
    renderWithRouter(<Login />);

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('has forgot password link', () => {
    renderWithRouter(<Login />);

    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/auth/recovery');
  });

  it('handles unexpected errors gracefully', async () => {
    const { auth } = await import('../../lib/supabase');
    vi.mocked(auth.signIn).mockRejectedValue(new Error('Network error'));

    renderWithRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
