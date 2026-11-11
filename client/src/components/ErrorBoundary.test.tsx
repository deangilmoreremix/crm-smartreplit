import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

// Mock child component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

const NormalComponent = () => <div>Normal component</div>;

describe('ErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('calls onError prop when error occurs', () => {
    const mockOnError = vi.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('retries when Try Again button is clicked', async () => {
    const user = userEvent.setup();

    // First render with error
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Swap in a child that no longer throws; the boundary stays in its error state
    // until the user retries.
    rerender(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry - this should reset the error boundary
    await user.click(screen.getByText('Try Again'));

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    // Mock development environment
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();

    // Restore original environment
    vi.unstubAllEnvs();
  });

  it('hides error details in production mode', () => {
    // Mock production environment
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    // Restore original environment
    vi.unstubAllEnvs();
  });
});
