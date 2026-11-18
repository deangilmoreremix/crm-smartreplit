import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { generateSalesInsights, state } = vi.hoisted(() => ({
  generateSalesInsights: vi.fn(),
  state: { contacts: {} as any, deals: [] as any[] },
}));
vi.mock('../../../services/edgeFunctionService', () => ({ generateSalesInsights }));
vi.mock('../../../hooks/useContactStore', () => ({ useContactStore: () => ({ contacts: state.contacts }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: state.deals }) }));

import SalesInsightsContent from '../SalesInsightsContent';

describe('SalesInsightsContent', () => {
  beforeEach(() => {
    generateSalesInsights.mockReset();
    state.contacts = {
      a: { id: 'a', name: 'Grace Hopper', company: 'Navy', status: 'lead', score: 80, updatedAt: '2025-01-01' },
    };
    state.deals = [
      { id: 'd1', title: 'Compiler Deal', value: 1000, stage: { id: 'closed-won', name: 'Closed Won' }, probability: 100 },
      { id: 'd2', title: 'Lost Deal', value: 500, stage: { id: 'closed-lost', name: 'Closed Lost' }, probability: 0 },
    ];
  });

  it('analyzes the real contacts and deals and shows computed stats', async () => {
    generateSalesInsights.mockResolvedValue('Real report text');
    render(<SalesInsightsContent />);
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Generate AI Pipeline Intelligence'));
    await waitFor(() => expect(screen.getByText('Real report text')).toBeInTheDocument());
    const [contacts, deals] = generateSalesInsights.mock.calls[0];
    expect(contacts[0]).toMatchObject({ name: 'Grace Hopper', company: 'Navy', score: 80 });
    expect(deals.map((d: any) => d.title)).toEqual(['Compiler Deal', 'Lost Deal']);
    expect(document.body.textContent).not.toMatch(/John Doe|Acme|\$120K/);
  });

  it('shows the server message on failure', async () => {
    generateSalesInsights.mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys'));
    render(<SalesInsightsContent />);
    fireEvent.click(screen.getByText('Generate AI Pipeline Intelligence'));
    await waitFor(() =>
      expect(screen.getByText('Add your OpenAI API key in Settings → API Keys')).toBeInTheDocument()
    );
  });

  it('shows an empty state and disables generation when there is no data', () => {
    state.contacts = {};
    state.deals = [];
    render(<SalesInsightsContent />);
    expect(screen.getByText(/No contacts or deals yet/)).toBeInTheDocument();
    expect(screen.getByText('Generate AI Pipeline Intelligence').closest('button')).toBeDisabled();
    expect(screen.queryByText('$120K')).toBeNull();
  });
});
