import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Deal } from '../../types/deal';
import { DEFAULT_DEAL_STAGES } from '../../data/demoData';

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  return {
    ResponsiveContainer: Passthrough,
    LineChart: Passthrough,
    BarChart: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Line: Nothing,
    Bar: Nothing,
    XAxis: Nothing,
    YAxis: Nothing,
    CartesianGrid: Nothing,
    Tooltip: Nothing,
    Legend: Nothing,
    Cell: Nothing,
  };
});

import DealAnalytics from '../DealAnalytics';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';

const stage = (id: string) => DEFAULT_DEAL_STAGES.find((s) => s.id === id)!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
let seq = 0;
const deal = (stageId: string, value: number, over: Partial<Deal> = {}): Deal => ({
  id: String(++seq),
  title: 't',
  value,
  stage: stage(stageId),
  probability: 50,
  contactId: 'none',
  priority: 'medium',
  source: 'other',
  tags: [],
  customFields: {},
  activities: [],
  attachments: [],
  createdAt: daysAgo(20),
  updatedAt: daysAgo(2),
  currency: 'USD',
  ...over,
});
const setDeals = (deals: Deal[]) => useDealStore.setState({ deals, realDeals: deals, demoEnabled: false });

describe('DealAnalytics', () => {
  it('shows an empty state without deals', () => {
    setDeals([]);
    render(<DealAnalytics />);
    expect(screen.getByTestId('deal-analytics-empty')).toBeInTheDocument();
  });

  it('computes metrics from object stages and is deterministic (no random data)', () => {
    useContactStore.setState({ contacts: {} });
    setDeals([
      deal('closed-won', 4000, { actualCloseDate: daysAgo(2) }),
      deal('closed-won', 2000, { actualCloseDate: daysAgo(6) }),
      deal('closed-lost', 1000),
      deal('proposal', 3000),
    ]);
    const first = render(<DealAnalytics />);
    const snapshot = first.container.textContent;
    expect(screen.getByText('Total Revenue').parentElement).toHaveTextContent('$6.0k');
    expect(screen.getByText('Avg Deal Size').parentElement).toHaveTextContent('$3.0k');
    expect(screen.getByText('Conversion Rate').parentElement).toHaveTextContent('50.0%');
    // Quick stats are computed, not the old '$95k' / '32 days' / '24%' literals
    expect(screen.queryByText('$95k')).toBeNull();
    expect(screen.queryByText('32 days')).toBeNull();
    expect(screen.queryByText('24%')).toBeNull();
    expect(screen.getByText('$4.0k')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    first.unmount();

    const second = render(<DealAnalytics />);
    expect(second.container.textContent).toBe(snapshot);
  });

  it('hides change badges when there is no previous period to compare', () => {
    setDeals([deal('closed-won', 4000, { actualCloseDate: daysAgo(2) })]);
    render(<DealAnalytics />);
    expect(screen.queryAllByTestId('deal-kpi-change')).toHaveLength(0);
  });

  it('week/month/quarter buttons filter the deals', () => {
    setDeals([
      deal('closed-won', 4000, { createdAt: daysAgo(2), updatedAt: daysAgo(1), actualCloseDate: daysAgo(1) }),
      deal('closed-won', 6000, { createdAt: daysAgo(60), updatedAt: daysAgo(50), actualCloseDate: daysAgo(50) }),
    ]);
    render(<DealAnalytics />);
    const revenue = () => screen.getByText('Total Revenue').parentElement!;
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(revenue()).toHaveTextContent('$4.0k');
    fireEvent.click(screen.getByRole('button', { name: 'Quarter' }));
    expect(revenue()).toHaveTextContent('$10.0k');
  });
});
