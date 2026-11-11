import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DemoDataProvider, useDemoData, useDemoDataSafe } from './DemoDataContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useAnalyticsStore } from '../store/analyticsStore';

const KEY = 'smartcrm_show_demo_data';

let ctx: ReturnType<typeof useDemoData>;
const Probe: React.FC = () => {
  ctx = useDemoData();
  return <span data-testid="flag">{String(ctx.showDemoData)}</span>;
};
const SafeProbe: React.FC = () => <span data-testid="safe">{String(useDemoDataSafe().showDemoData)}</span>;

describe('DemoDataContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to showing demo data and syncs it to every store', () => {
    render(
      <DemoDataProvider>
        <Probe />
      </DemoDataProvider>
    );
    expect(screen.getByTestId('flag')).toHaveTextContent('true');
    expect(useDealStore.getState().demoEnabled).toBe(true);
    expect(useContactStore.getState().demoEnabled).toBe(true);
    expect(useAppointmentStore.getState().demoEnabled).toBe(true);
    expect(useAnalyticsStore.getState().demoEnabled).toBe(true);
  });

  it('clearDemoData hides sample data everywhere and keeps real data; restoreDemoData brings it back', async () => {
    render(
      <DemoDataProvider>
        <Probe />
      </DemoDataProvider>
    );
    const real = { ...useDealStore.getState().demoDeals[0], id: '42', isDemo: undefined };
    act(() => useDealStore.setState({ deals: [real] }));
    act(() => useContactStore.setState((s) => ({ contacts: { ...s.contacts, '900': { id: '900', name: 'Real Person', email: 'r@x.io' } as any } })));
    await act(async () => {
      await useAppointmentStore.getState().fetchAppointments();
    });
    expect(Object.keys(useAppointmentStore.getState().appointments).length).toBe(3);

    act(() => ctx.clearDemoData());
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(localStorage.getItem(KEY)).toBe('false');
    expect(useDealStore.getState().demoEnabled).toBe(false);
    expect(useDealStore.getState().getFilteredDeals().map((d) => d.id)).toEqual(['42']);
    expect(Object.keys(useContactStore.getState().contacts)).toEqual(['900']);
    expect(Object.keys(useAppointmentStore.getState().appointments)).toEqual([]);
    expect(useAnalyticsStore.getState().insights).toEqual([]);
    await act(async () => {
      useAnalyticsStore.getState().updateMetrics();
      await useAppointmentStore.getState().fetchAppointments();
    });
    expect(useAnalyticsStore.getState().salesMetrics.totalRevenue).toBe(0);
    expect(Object.keys(useAppointmentStore.getState().appointments)).toEqual([]);

    act(() => ctx.restoreDemoData());
    expect(localStorage.getItem(KEY)).toBe('true');
    expect(useDealStore.getState().getFilteredDeals().length).toBe(5);
    expect(Object.keys(useContactStore.getState().contacts).sort()).toEqual(['1', '2', '3', '4', '5', '900']);
    expect(Object.keys(useAppointmentStore.getState().appointments).length).toBe(3);
  });

  it('reads the persisted flag on mount', () => {
    localStorage.setItem(KEY, 'false');
    render(
      <DemoDataProvider>
        <Probe />
      </DemoDataProvider>
    );
    expect(screen.getByTestId('flag')).toHaveTextContent('false');
    expect(useDealStore.getState().demoEnabled).toBe(false);
  });

  it('useDemoData throws outside a provider but useDemoDataSafe returns false', () => {
    expect(() => render(<Probe />)).toThrow(/DemoDataProvider/);
    render(<SafeProbe />);
    expect(screen.getByTestId('safe')).toHaveTextContent('false');
  });
});
