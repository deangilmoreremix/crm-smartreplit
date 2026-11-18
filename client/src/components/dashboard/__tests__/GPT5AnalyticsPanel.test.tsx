import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const deal = (id: string, value: number, stage: string) => ({
  id,
  title: `Deal ${id}`,
  value,
  stage,
  createdAt: new Date().toISOString(),
});

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/dealStore', () => ({
  useDealStore: () => ({ deals: { a: deal('a', 10000, 'proposal'), b: deal('b', 20000, 'won') } }),
}));
vi.mock('../../../store/contactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
vi.mock('../../../store/taskStore', () => ({ useTaskStore: () => ({ tasks: {} }) }));
vi.mock('../../../services/aiGenerate', () => ({ generateAI: vi.fn() }));

import GPT5AnalyticsPanel from '../GPT5AnalyticsPanel';
import { generateAI } from '../../../services/aiGenerate';

describe('GPT5AnalyticsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call the AI or show insights until the user runs the analysis', () => {
    render(<GPT5AnalyticsPanel />);
    expect(generateAI).not.toHaveBeenCalled();
    expect(screen.getByText('$30,000')).toBeInTheDocument(); // real pipeline value from the store
    expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
  });

  it('renders the AI result with only the schema-provided confidence', async () => {
    vi.mocked(generateAI).mockResolvedValue({
      content: '',
      sources: [],
      model: 'm',
      data: {
        insights: [{ title: 'Stage mix', insight: 'One of two deals is won', confidence: 0.61, priority: 'high', recommendations: ['Call deal A'] }],
        growthOpportunities: ['Upsell the won account'],
        strategicRecommendations: ['Qualify earlier'],
      },
    });
    render(<GPT5AnalyticsPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Run analysis' }));

    expect(await screen.findByText('One of two deals is won')).toBeInTheDocument();
    expect(screen.getByText('61% confidence')).toBeInTheDocument();
    expect(screen.getByText('Call deal A')).toBeInTheDocument();
    expect(screen.getByText('Upsell the won account')).toBeInTheDocument();
    expect(screen.getByText('Qualify earlier')).toBeInTheDocument();
    const call = vi.mocked(generateAI).mock.calls[0][0];
    expect(call).toMatchObject({ schemaName: 'crm_analytics' });
    expect(call.prompt).not.toMatch(/benchmarks|growing/);
    for (const fake of ['92%', '88%', '85%', '75%', 'projected monthly revenue', '$9,000']) {
      expect(document.body).not.toHaveTextContent(fake);
    }
  });

  it('shows the server message on failure and no canned insights', async () => {
    vi.mocked(generateAI).mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys.'));
    render(<GPT5AnalyticsPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Run analysis' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Add your OpenAI API key');
    expect(document.body).not.toHaveTextContent('Basic Pipeline Analysis');
    expect(document.body).not.toHaveTextContent('Review deal progression');
    expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
  });
});
