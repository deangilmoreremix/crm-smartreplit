import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsCards from '../MetricsCards';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

let mockDeals: Record<string, any> = {};

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../contexts/NavigationContext', () => ({
  useNavigation: () => ({ navigateToFeature: vi.fn() }),
}));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: mockDeals }) }));

const deal = (id: string, value: number, stage: string, daysAgo: number) => ({
  id,
  value,
  stage,
  createdAt: ago(daysAgo),
  updatedAt: ago(daysAgo),
});

describe('MetricsCards', () => {
  it('renders values computed from the deal store, not the old literals', () => {
    mockDeals = {
      a: deal('a', 1000, 'qualification', 1),
      b: deal('b', 3000, 'proposal', 2),
      c: deal('c', 9000, 'closed-won', 3),
    };
    render(<MetricsCards />);
    expect(screen.getByText('$4,000')).toBeInTheDocument(); // pipeline value
    expect(screen.getByText('$2,000')).toBeInTheDocument(); // avg open deal size
    expect(screen.getByText('Won Deals').previousSibling).toHaveTextContent('1');
    for (const fake of ['34', '$247K', '20', '$12.3K', '+12%', '+8%', '+15%', '-3%']) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });

  it('shows a real change only when prior-period data exists', () => {
    mockDeals = {
      a: deal('a', 100, 'qualification', 1),
      b: deal('b', 100, 'qualification', 2),
      c: deal('c', 100, 'qualification', 40),
    };
    render(<MetricsCards />);
    expect(screen.getAllByText('+100%').length).toBeGreaterThan(0);
  });

  it('shows zeros and no badges with no deals', () => {
    mockDeals = {};
    render(<MetricsCards />);
    expect(screen.getByText('Active Deals').previousSibling).toHaveTextContent('0');
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
