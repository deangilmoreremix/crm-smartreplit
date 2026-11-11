import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionErrorBoundary from './SectionErrorBoundary';

let shouldThrow = true;
const Flaky = () => {
  if (shouldThrow) throw new Error('boom');
  return <div>Section content</div>;
};

describe('SectionErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('catches a render error, keeps siblings, and retries', () => {
    shouldThrow = true;
    render(
      <div>
        <SectionErrorBoundary name="a">
          <Flaky />
        </SectionErrorBoundary>
        <p>Sibling</p>
      </div>
    );
    expect(screen.getByText('This section failed to load')).toBeInTheDocument();
    expect(screen.getByText('Sibling')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.queryByText('This section failed to load')).not.toBeInTheDocument();
  });
});
