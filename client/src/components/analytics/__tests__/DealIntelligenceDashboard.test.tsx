import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const now = new Date();
const dealsState = {
  deals: {
    d1: {
      id: 'd1',
      title: 'Acme Renewal',
      value: 42000,
      stage: 'proposal',
      probability: 50,
      contactId: 'c1',
      priority: 'high',
      createdAt: now,
      updatedAt: now,
    },
    d2: {
      id: 'd2',
      title: 'Old Win',
      value: 1000,
      stage: 'closed_won',
      probability: 100,
      contactId: 'c1',
      createdAt: now,
      updatedAt: now,
    },
  } as Record<string, any>,
};

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => dealsState }));
vi.mock('@/hooks/useContactStore', () => ({
  useContactStore: () => ({ contacts: { c1: { id: 'c1', name: 'Jane Doe', company: 'Acme', status: 'hot' } } }),
}));
vi.mock('../../../services/gpt5Service', () => ({ gpt5Service: { analyzeDealIntelligence: vi.fn() } }));

import DealIntelligenceDashboard from '../DealIntelligenceDashboard';
import { gpt5Service } from '../../../services/gpt5Service';

const analyze = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Analyze Deals' }));
  await userEvent.click(screen.getByRole('button', { name: 'AI Intelligence' }));
};

describe('DealIntelligenceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the real fields returned by deal intelligence for open deals only', async () => {
    vi.mocked(gpt5Service.analyzeDealIntelligence).mockResolvedValue({
      probability_score: 64,
      risk_level: 'medium',
      key_factors: ['Champion engaged'],
      recommendations: ['Send revised quote'],
      confidence_level: 0.9,
      estimated_close_days: 21,
    });
    render(<DealIntelligenceDashboard />);
    await analyze();

    expect(await screen.findByText('64% win probability')).toBeInTheDocument();
    expect(gpt5Service.analyzeDealIntelligence).toHaveBeenCalledTimes(1); // the closed deal is skipped
    expect(vi.mocked(gpt5Service.analyzeDealIntelligence).mock.calls[0][0]).toMatchObject({ title: 'Acme Renewal', value: 42000 });
    expect(screen.getByText('Risk level:')).toBeInTheDocument();
    expect(screen.getByText('Champion engaged')).toBeInTheDocument();
    expect(screen.getByText('Send revised quote')).toBeInTheDocument();
    expect(screen.getByText('21 days')).toBeInTheDocument();
    expect(screen.getByText('90% confidence')).toBeInTheDocument(); // 0.9 -> 90%, not "1%"
    expect(document.body).not.toHaveTextContent('1% confidence');
    expect(document.body).not.toHaveTextContent('Follow up with contact');
    expect(document.body).not.toHaveTextContent('Predicted Value');
  });

  it('shows the server message when the user has no OpenAI key', async () => {
    vi.mocked(gpt5Service.analyzeDealIntelligence).mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys.'));
    render(<DealIntelligenceDashboard />);
    await analyze();

    expect(await screen.findByRole('alert')).toHaveTextContent('Add your OpenAI API key');
    expect(screen.getByText('No Intelligence Data')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('Review proposal');
  });

  it('omits confidence and close days the AI did not provide', async () => {
    vi.mocked(gpt5Service.analyzeDealIntelligence).mockResolvedValue({ probability_score: 0.3, key_factors: [], recommendations: [] });
    render(<DealIntelligenceDashboard />);
    await analyze();

    expect(await screen.findByText('30% win probability')).toBeInTheDocument();
    expect(screen.queryByText(/% confidence/)).not.toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
