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

  it('only lists content that is really hidden (no tasks / communications)', () => {
    setup();
    expect(screen.getByText(/Sample deals in the pipeline/)).toBeInTheDocument();
    expect(screen.getByText(/Sample contacts/)).toBeInTheDocument();
    expect(screen.getByText(/Sample appointments/)).toBeInTheDocument();
    expect(screen.queryByText(/tasks/i)).toBeNull();
    expect(screen.queryByText(/communications/i)).toBeNull();
  });

  it('Clear Demo Data hides sample data (flag + deal store) and closes', () => {
    const onClose = vi.fn();
    setup(onClose);
    expect(useDealStore.getState().demoEnabled).toBe(true);
    fireEvent.click(screen.getByTestId('button-clear-demo'));
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(useDealStore.getState().demoEnabled).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onClose).toHaveBeenCalled();
  });
});
