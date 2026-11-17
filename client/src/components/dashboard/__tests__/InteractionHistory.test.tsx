import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InteractionHistory from '../InteractionHistory';

let mockDeals: Record<string, any> = {};

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({ contacts: { c1: { id: 'c1', name: 'Jane Roe' } } }),
}));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: mockDeals }) }));

const OLD_LITERALS = ['Royal Package Opportunity', 'Third Deal Most Useful', '11,250$', '21,300$'];

const renderIt = () =>
  render(
    <MemoryRouter>
      <InteractionHistory />
    </MemoryRouter>
  );

describe('InteractionHistory', () => {
  it('renders real deals', () => {
    mockDeals = {
      d1: {
        id: 'd1',
        title: 'Widget Order',
        value: 4200,
        stage: 'proposal',
        contactId: 'c1',
        updatedAt: new Date(2030, 2, 5, 12),
      },
    };
    renderIt();
    expect(screen.getByText('Widget Order')).toBeInTheDocument();
    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText('Mar 5')).toBeInTheDocument();
    for (const fake of OLD_LITERALS) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });

  it('shows an empty state with no deals', () => {
    mockDeals = {};
    renderIt();
    expect(screen.getByText(/No deals yet/)).toBeInTheDocument();
    for (const fake of OLD_LITERALS) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
  });
});
