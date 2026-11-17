import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const deal = (id: string, value: number, probability: number, extra: any = {}) => ({
  id,
  title: `Deal ${id}`,
  value,
  probability,
  stage: 'proposal',
  contactId: 'c1',
  updatedAt: new Date(),
  ...extra,
});
const dealsState = {
  deals: {
    a: deal('a', 80000, 90),
    b: deal('b', 20000, 30, { daysInStage: 25 }),
    c: deal('c', 5000, 40, { updatedAt: daysAgo(30) }),
    d: deal('d', 999, 99, { stage: 'closed-won' }),
  } as Record<string, any>,
};
const keysState = { apiConfig: { openai: { apiKey: '' } }, isLoading: false };

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../AIToolsProvider', () => ({ useAITools: () => ({ openTool: vi.fn() }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => dealsState }));
vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({ contacts: { c1: { id: 'c1', name: 'Jane Doe', status: 'hot' } } }),
}));
vi.mock('../../../hooks/useAIApiKeys', () => ({ useAIApiKeys: () => keysState }));
vi.mock('../../../services/aiGenerate', () => ({ generateAI: vi.fn() }));

import AIInsightsPanel from '../AIInsightsPanel';
import { generateAI } from '../../../services/aiGenerate';

describe('AIInsightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    keysState.apiConfig.openai.apiKey = '';
  });

  it('computes the cards from the real deals and makes no trend claims', () => {
    render(<AIInsightsPanel />);
    expect(screen.getByText('3 open deals worth $105,000; 1 over $50,000.')).toBeInTheDocument();
    expect(screen.getByText('2 open deals have been in their stage for more than 10 days.')).toBeInTheDocument();
    expect(screen.getByText('1 open deals are above 70% probability.')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('23%');
    expect(document.body).not.toHaveTextContent('85%+');
    expect(document.body).not.toHaveTextContent('Pipeline Health Strong');
    expect(generateAI).not.toHaveBeenCalled();
  });

  it('reads configured status from useAIApiKeys', () => {
    const { unmount } = render(<AIInsightsPanel />);
    expect(screen.getByText(/Add your OpenAI API key in Settings/)).toBeInTheDocument();
    unmount();
    keysState.apiConfig.openai.apiKey = 'sk-test';
    render(<AIInsightsPanel />);
    expect(screen.queryByText(/Add your OpenAI API key in Settings/)).not.toBeInTheDocument();
  });

  it('replaces the cards with the AI result using a strict schema', async () => {
    vi.mocked(generateAI).mockResolvedValue({
      content: '',
      sources: [],
      model: 'm',
      data: { insights: [{ type: 'warning', title: 'Deal B is stuck', description: 'Deal B sat 25 days.' }] },
    });
    render(<AIInsightsPanel />);
    await userEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    expect(await screen.findByText('Deal B sat 25 days.')).toBeInTheDocument();
    expect(vi.mocked(generateAI).mock.calls[0][0]).toMatchObject({ schemaName: 'pipeline_insights' });
    expect(screen.queryByText('Open Pipeline')).not.toBeInTheDocument();
  });

  it('shows the server message on failure and keeps the computed counts', async () => {
    vi.mocked(generateAI).mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys.'));
    render(<AIInsightsPanel />);
    await userEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Add your OpenAI API key in Settings → API Keys.');
    expect(screen.getByText('Open Pipeline')).toBeInTheDocument();
  });
});
