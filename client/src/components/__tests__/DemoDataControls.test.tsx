import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import { DemoDataProvider, useDemoData } from '../../contexts/DemoDataContext';
import ClearDemoDataModal from '../ClearDemoDataModal';
import RestoreSampleData from '../RestoreSampleData';
import CustomerProfile from '../dashboard/CustomerProfile';
import { MemoryRouter } from 'react-router-dom';

const Flag = () => <span data-testid="flag">{String(useDemoData().showDemoData)}</span>;

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ClearDemoDataModal', () => {
  it('clearing flips the flag, hides sample blocks, then closes after the timer', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <DemoDataProvider>
          <Flag />
          <CustomerProfile />
          <ClearDemoDataModal isOpen onClose={onClose} />
        </DemoDataProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Eva Robinson')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('button-clear-demo'));
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(screen.queryByText('Eva Robinson')).toBeNull();
    expect(screen.getByTestId('customer-profile-empty')).toBeInTheDocument();
    expect(localStorage.getItem('smartcrm_show_demo_data')).toBe('false');
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not fire the close timer after unmount', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { unmount } = render(
      <DemoDataProvider>
        <ClearDemoDataModal isOpen onClose={onClose} />
      </DemoDataProvider>
    );
    fireEvent.click(screen.getByTestId('button-clear-demo'));
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('RestoreSampleData', () => {
  it('renders nothing while sample data is shown, and restores it when hidden', () => {
    localStorage.setItem('smartcrm_show_demo_data', 'false');
    render(
      <DemoDataProvider>
        <Flag />
        <RestoreSampleData />
      </DemoDataProvider>
    );
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    fireEvent.click(screen.getByTestId('button-restore-sample-data'));
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
    expect(screen.queryByTestId('button-restore-sample-data')).toBeNull();
  });
});

describe('DemoDataProvider storage safety', () => {
  it('defaults to on and does not throw when localStorage is unavailable', () => {
    // Only the provider's own key is blocked; other stores' persistence is out of scope here.
    const KEY = 'smartcrm_show_demo_data';
    const realGet = Storage.prototype.getItem;
    const realSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, k: string) {
      if (k === KEY) throw new Error('denied');
      return realGet.call(this, k);
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      k: string,
      v: string
    ) {
      if (k === KEY) throw new Error('denied');
      realSet.call(this, k, v);
    });
    render(
      <DemoDataProvider>
        <Flag />
      </DemoDataProvider>
    );
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
  });
});

describe('SampleDataSettingsCard', () => {
  it('toggle hides and re-shows sample data', async () => {
    const { SampleDataSettingsCard } = await import('../RestoreSampleData');
    render(
      <DemoDataProvider>
        <Flag />
        <SampleDataSettingsCard />
      </DemoDataProvider>
    );
    const toggle = screen.getByTestId('toggle-sample-data');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(screen.getByTestId('button-restore-sample-data')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
  });
});
