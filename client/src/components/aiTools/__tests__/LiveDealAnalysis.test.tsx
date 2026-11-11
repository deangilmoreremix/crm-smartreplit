import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({ realDeals: [] as any[], insights: vi.fn() }));

vi.mock('../../../store/dealStore', () => ({
  useDealStore: (sel: (s: any) => any) => sel({ realDeals: h.realDeals }),
}));
vi.mock('../../../services/openAIService', () => ({
  default: { generateDealInsights: h.insights },
}));

import LiveDealAnalysis from '../LiveDealAnalysis';

const real = (id: string, title: string) => ({
  id,
  title,
  value: 1234,
  stage: { id: 'proposal', name: 'Proposal' },
  probability: 20,
  priority: 'low',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
});

beforeEach(() => {
  h.insights.mockReset();
  h.insights.mockResolvedValue({
    winProbability: 55,
    riskLevel: 'low',
    potentialBlockers: [],
    opportunities: [],
    recommendedActions: [],
  });
});

describe('LiveDealAnalysis deal picker', () => {
  it('defaults to the first real deal and can switch', async () => {
    h.realDeals = [real('a', 'Alpha'), real('b', 'Beta')];
    render(<LiveDealAnalysis />);
    expect((screen.getByLabelText('Deal to analyze') as HTMLSelectElement).value).toBe('a');
    await userEvent.click(screen.getByText('Analyze Deal'));
    await waitFor(() => expect(h.insights).toHaveBeenCalled());
    expect(h.insights.mock.calls[0][0].title).toBe('Alpha');
    expect(h.insights.mock.calls[0][0].stage).toBe('proposal');

    await userEvent.selectOptions(screen.getByLabelText('Deal to analyze'), 'b');
    await userEvent.click(screen.getByText('Analyze Deal'));
    await waitFor(() => expect(h.insights).toHaveBeenCalledTimes(2));
    expect(h.insights.mock.calls[1][0].title).toBe('Beta');
  });

  it('falls back to the labelled sample deal when there are no real deals', async () => {
    h.realDeals = [];
    render(<LiveDealAnalysis />);
    expect(screen.getByTestId('sample-deal-note')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Analyze Deal'));
    await waitFor(() => expect(h.insights).toHaveBeenCalled());
    expect(h.insights.mock.calls[0][0].title).toBe('Enterprise License');
  });

  it('keeps showing errors from the AI call', async () => {
    h.realDeals = [real('a', 'Alpha')];
    h.insights.mockRejectedValue(new Error('boom'));
    render(<LiveDealAnalysis />);
    await userEvent.click(screen.getByText('Analyze Deal'));
    await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument());
  });
});
