import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentActivity from '../RecentActivity';

const HOUR = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);

let mockDeals: Record<string, any> = {};
let mockContacts: Record<string, any> = {};
let mockTasks: any[] = [];

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({ contacts: mockContacts }),
}));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: mockDeals }) }));
vi.mock('../../../store/taskStore', () => ({ useTaskStore: () => ({ tasks: mockTasks }) }));

const OLD_LITERALS = ['TechCorp Solutions', 'Innovation Labs', 'Global Dynamics', '$85,000'];

const renderIt = () =>
  render(
    <MemoryRouter>
      <RecentActivity />
    </MemoryRouter>
  );

describe('RecentActivity', () => {
  it('renders real upcoming deals and recent activity', () => {
    mockContacts = { c1: { id: 'c1', name: 'Jane Roe', createdAt: ago(100), updatedAt: ago(100) } };
    mockDeals = {
      d1: {
        id: 'd1',
        title: 'Widget Order',
        value: 4200,
        stage: 'proposal',
        probability: 40,
        contactId: 'c1',
        expectedCloseDate: new Date('2030-01-15T12:00:00Z'),
        createdAt: ago(48),
        updatedAt: ago(2),
      },
      d2: {
        id: 'd2',
        title: 'Closed Thing',
        value: 1,
        stage: 'closed-won',
        probability: 100,
        contactId: 'c1',
        createdAt: ago(480),
        updatedAt: ago(480),
      },
    };
    mockTasks = [
      {
        id: 't1',
        title: 'Call Jane',
        status: 'completed',
        completedDate: ago(1),
        updatedAt: ago(1),
      },
      { id: 't2', title: 'Send quote', status: 'pending', updatedAt: ago(30) },
    ];
    renderIt();
    expect(screen.getAllByText('Widget Order').length).toBeGreaterThan(0);
    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.queryByText('Closed Thing')).not.toBeInTheDocument(); // not upcoming
    expect(screen.getByText('Task completed')).toBeInTheDocument();
    expect(screen.getByText('Call Jane')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
    for (const fake of [...OLD_LITERALS, '24 completed', '8 pending', 'Assistant Insight']) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });

  it('shows honest empty states with no data', () => {
    mockContacts = {};
    mockDeals = {};
    mockTasks = [];
    renderIt();
    expect(screen.getByText('No open deals yet.')).toBeInTheDocument();
    expect(screen.getByText('No recent activity yet.')).toBeInTheDocument();
    for (const fake of OLD_LITERALS) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });
});
