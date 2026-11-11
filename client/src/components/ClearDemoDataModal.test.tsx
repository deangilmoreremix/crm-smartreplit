import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { DemoDataProvider, useDemoData } from '../contexts/DemoDataContext';
import { useDealStore } from '../store/dealStore';
import ClearDemoDataModal from './ClearDemoDataModal';

const Flag: React.FC = () => <span data-testid="flag">{String(useDemoData().showDemoData)}</span>;

const setup = (onClose = vi.fn()) =>
  render(
    <ThemeProvider>
      <DemoDataProvider>
        <Flag />
        <ClearDemoDataModal isOpen onClose={onClose} />
      </DemoDataProvider>
    </ThemeProvider>
  );

describe('ClearDemoDataModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('lists the content that is hidden, including the gated dashboard blocks', () => {
    setup();
    expect(screen.getByText(/Sample deals in the pipeline/)).toBeInTheDocument();
    expect(screen.getByText(/Sample contacts/)).toBeInTheDocument();
    expect(screen.getByText(/Sample appointments/)).toBeInTheDocument();
    expect(screen.getByText(/customer profile, tasks and interaction history/i)).toBeInTheDocument();
    expect(screen.getByText(/communications, upcoming deals and activity feed/i)).toBeInTheDocument();
  });

  it('Clear Demo Data hides sample data (flag + deal store) and closes', () => {
    const onClose = vi.fn();
    setup(onClose);
    expect(useDealStore.getState().demoEnabled).toBe(true);
    fireEvent.click(screen.getByTestId('button-clear-demo'));
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(useDealStore.getState().demoEnabled).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
