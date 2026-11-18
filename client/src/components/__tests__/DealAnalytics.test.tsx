import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DealAnalytics from '../DealAnalytics';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

let mockDeals: Record<string, any> = {};
let mockContacts: Record<string, any> = {};

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../store/dealStore', () => ({
  useDealStore: () => ({ deals: mockDeals, getStageValues: () => ({}) }),
}));
vi.mock('../../store/contactStore', () => ({
  useContactStore: () => ({ contacts: mockContacts }),
}));
vi.mock('recharts', () => {
  const Passthrough = ({ children }: any) => <div>{children}</div>;
  return {
    LineChart: Passthrough,
    Line: Passthrough,
    BarChart: Passthrough,
    Bar: Passthrough,
    XAxis: Passthrough,
    YAxis: Passthrough,
    CartesianGrid: Passthrough,
    Tooltip: Passthrough,
    Legend: Passthrough,
    ResponsiveContainer: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Cell: Passthrough,
  };
});

const deal = (id: string, value: number, stage: string, daysAgo: number) => ({
  id,
  value,
  stage,
  contactId: 'c1',
  createdAt: ago(daysAgo),
  updatedAt: ago(daysAgo),
});

describe('DealAnalytics KPI badges', () => {
  it('shows real period-over-period changes and not the old literals', () => {
    mockDeals = {
      a: deal('a', 2000, 'closed-won', 2),
      b: deal('b', 1000, 'closed-won', 40),
    };
    mockContacts = {
      c1: { id: 'c1', name: 'A', createdAt: ago(3), updatedAt: ago(3) },
      c2: { id: 'c2', name: 'B', createdAt: ago(4), updatedAt: ago(4) },
      c3: { id: 'c3', name: 'C', createdAt: ago(50), updatedAt: ago(50) },
    };
    render(<DealAnalytics />);
    // revenue 2000 vs 1000 and contacts 2 vs 1 are both +100%
    expect(screen.getAllByText(/\+100%/).length).toBeGreaterThanOrEqual(2);
    for (const fake of ['+12.5%', '+8.2%', '+15.3%', '-2.1%']) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });

  it('hides badges with no prior-period data', () => {
    mockDeals = { a: deal('a', 2000, 'closed-won', 2) };
    mockContacts = {};
    render(<DealAnalytics />);
    expect(screen.queryByTitle('Last 30 days vs the previous 30 days')).not.toBeInTheDocument();
  });
});
