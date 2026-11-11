import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  deals: [] as any[],
  openTool: vi.fn(),
  generate: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../AIToolsProvider', () => ({ useAITools: () => ({ openTool: h.openTool }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: h.deals }) }));
vi.mock('../../../store/contactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
vi.mock('../../../services/openAIService', () => ({
  openAIService: { generateContent: h.generate },
}));

import AIInsightsPanel from '../AIInsightsPanel';

const stage = (id: string) => ({ id, name: id });
const deal = (id: string, stageId: string, value: number, extra: any = {}) => ({
  id,
  title: `Deal ${id}`,
  value,
  stage: stage(stageId),
  probability: 50,
  contactId: 'c',
  ...extra,
});

beforeEach(() => {
  h.deals = [
    deal('1', 'closed-won', 90000),
    deal('2', 'proposal', 60000, { daysInStage: 12, probability: 80 }),
    deal('3', 'closed-lost', 1000),
  ];
  h.openTool.mockReset();
  h.generate.mockReset();
});

describe('AIInsightsPanel', () => {
  it('counts active deals via stage.id and shows no templated velocity text', () => {
    const { container } = render(<AIInsightsPanel />);
    expect(screen.getByText(/1 active deals worth \$60,000; 1 above \$50,000/)).toBeInTheDocument();
    expect(screen.getByText(/1 active deals have been in their stage for more than 10 days/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/23%|85%\+/);
  });

  it('opens real AI tool ids from the cards', async () => {
    render(<AIInsightsPanel />);
    await userEvent.click(screen.getByText('Pipeline Overview'));
    await userEvent.click(screen.getByText('Stalled Deals'));
    await userEvent.click(screen.getByText('High-Probability Deals'));
    expect(h.openTool.mock.calls.map((c) => c[0])).toEqual([
      'sales-insights',
      'live-deal-analysis',
      'sales-forecast',
    ]);
  });

  it('renders the AI result of Generate Insights', async () => {
    h.generate.mockResolvedValue({
      content: '```json\n{"insights":[{"type":"warning","title":"Real AI title","description":"Real AI body"}]}\n```',
    });
    render(<AIInsightsPanel />);
    await userEvent.click(screen.getByText('Generate Insights'));
    await waitFor(() => expect(screen.getByText('Real AI title')).toBeInTheDocument());
    expect(screen.getByText('Real AI body')).toBeInTheDocument();
    expect(h.generate.mock.calls[0][0].messages[1].content).toContain('Deal 2');
  });

  it('shows the error and no AI cards when generation fails', async () => {
    h.generate.mockRejectedValue(new Error('AI API error: 400 - No OpenAI API key configured'));
    render(<AIInsightsPanel />);
    await userEvent.click(screen.getByText('Generate Insights'));
    await waitFor(() => expect(screen.getByText(/Add your OpenAI API key/)).toBeInTheDocument());
    expect(screen.queryByTestId('ai-generated-insights')).not.toBeInTheDocument();
  });

  it('refreshes counts when deals change', () => {
    const { rerender } = render(<AIInsightsPanel />);
    h.deals = [...h.deals, deal('4', 'qualification', 70000)];
    rerender(<AIInsightsPanel />);
    expect(screen.getByText(/2 active deals worth \$130,000; 2 above \$50,000/)).toBeInTheDocument();
  });
});
