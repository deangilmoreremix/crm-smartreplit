import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Deal } from '../../../types/deal';
import { DEFAULT_DEAL_STAGES } from '../../../data/demoData';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import KPICards from '../KPICards';
import MetricsCards from '../MetricsCards';
import { useDealStore } from '../../../store/dealStore';
import { useContactStore } from '../../../store/contactStore';

const stage = (id: string) => DEFAULT_DEAL_STAGES.find((s) => s.id === id)!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
let seq = 0;
const deal = (stageId: string, value: number, createdDaysAgo: number): Deal => ({
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
  createdAt: daysAgo(createdDaysAgo),
  updatedAt: daysAgo(1),
  currency: 'USD',
});

const setDeals = (deals: Deal[]) =>
  useDealStore.setState({ deals, realDeals: deals, demoEnabled: false });

const renderIt = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('KPICards', () => {
  beforeEach(() => {
    navigate.mockReset();
    useContactStore.setState({ contacts: {} });
  });

  it('counts active and won deals from object stages', () => {
    setDeals([
      deal('qualification', 1000, 5),
      deal('proposal', 3000, 5),
      deal('closed-won', 8000, 5),
      deal('closed-lost', 500, 5),
    ]);
    renderIt(<KPICards />);
    const card = (title: string) => screen.getByText(title).closest('[role="button"]') as HTMLElement;
    expect(card('Active Deals')).toHaveTextContent('2');
    expect(card('Pipeline Value')).toHaveTextContent('$4,000');
    expect(card('Won Deals')).toHaveTextContent('1');
    expect(card('Avg Deal Size')).toHaveTextContent('$2,000');
  });

  it('hides the change badge when there is no previous period, shows a computed one otherwise', () => {
    setDeals([deal('proposal', 100, 5)]);
    const { unmount } = renderIt(<KPICards />);
    expect(screen.queryAllByTestId('kpi-change')).toHaveLength(0);
    expect(screen.queryByText('+12%')).toBeNull();
    unmount();

    setDeals([deal('proposal', 100, 5), deal('proposal', 100, 10), deal('proposal', 100, 40)]);
    renderIt(<KPICards />);
    expect(screen.getAllByTestId('kpi-change')[0]).toHaveTextContent('+100%');
  });

  it('navigates with the router instead of NavigationContext', () => {
    setDeals([deal('proposal', 100, 5)]);
    renderIt(<KPICards />);
    fireEvent.click(screen.getByText('Pipeline Value'));
    expect(navigate).toHaveBeenLastCalledWith('/pipeline');
    fireEvent.click(screen.getByText('Avg Deal Size'));
    expect(navigate).toHaveBeenLastCalledWith('/analytics');
  });
});

describe('MetricsCards', () => {
  it('shows the same store-derived numbers as KPICards (no static figures)', () => {
    setDeals([deal('proposal', 1000, 5), deal('closed-won', 4000, 5)]);
    renderIt(<MetricsCards />);
    const card = (title: string) => screen.getByText(title).closest('[role="button"]') as HTMLElement;
    expect(card('Active Deals')).toHaveTextContent('1');
    expect(card('Pipeline Value')).toHaveTextContent('$1,000');
    expect(card('Won Deals')).toHaveTextContent('1');
    expect(screen.queryByText('$247K')).toBeNull();
    fireEvent.click(screen.getByText('Won Deals'));
    expect(navigate).toHaveBeenLastCalledWith('/analytics');
  });
});
