import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KPICards from '../KPICards';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

let mockDeals: Record<string, any> = {};

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../contexts/NavigationContext', () => ({
  useNavigation: () => ({ navigateToFeature: vi.fn() }),
}));
vi.mock('../../../store/contactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: mockDeals }) }));

const deal = (id: string, value: number, stage: string, createdDaysAgo: number) => ({
  id,
  value,
  stage,
  contactId: 'x',
  createdAt: ago(createdDaysAgo),
  updatedAt: ago(createdDaysAgo),
});

describe('KPICards', () => {
  it('computes values and real period changes', () => {
    // 3 deals created in the last 30d vs 2 in the 30d before -> +50%
    mockDeals = {
      a: deal('a', 1000, 'qualification', 1),
      b: deal('b', 2000, 'proposal', 5),
      c: deal('c', 3000, 'closed-won', 10),
      d: deal('d', 500, 'qualification', 40),
      e: deal('e', 500, 'proposal', 45),
    };
    render(<KPICards />);
    expect(screen.getAllByText('$1,000').length).toBeGreaterThan(0); // avg open deal size
    expect(screen.getAllByText('+50%').length).toBeGreaterThan(0);
    for (const fake of ['+12%', '+8%', '+15%', '-3%']) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });

  it('hides trend badges when there is no prior-period data', () => {
    mockDeals = { a: deal('a', 1000, 'qualification', 1) };
    render(<KPICards />);
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});
