import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const deal = { id: '1', title: 'Acme renewal', value: 12000, stage: 'proposal', probability: 40, company: 'Acme', createdAt: new Date(), updatedAt: new Date() };
const state = { deals: [deal] as any[] };
vi.mock('../../../store/dealStore', () => ({
  useDealStore: (selector: any) => selector(state),
}));
let resolveAI: (v: any) => void;
let rejectAI: (e: Error) => void;
const generateAI = vi.fn(
  () =>
    new Promise((resolve, reject) => {
      resolveAI = resolve;
      rejectAI = reject;
    })
);
vi.mock('../../../services/aiGenerate', () => ({ generateAI: (...a: any[]) => (generateAI as any)(...a) }));

import LiveDealAnalysis from '../LiveDealAnalysis';

describe('LiveDealAnalysis', () => {
  beforeEach(() => {
    state.deals = [deal];
    generateAI.mockClear();
  });

  it('shows a plain spinner (no fake step text) while the call is pending, then the real result', async () => {
    render(<LiveDealAnalysis />);
    await userEvent.click(screen.getByText('Analyze Deal'));
    expect(screen.getByText('Analyzing deal...')).toBeInTheDocument();
    expect(screen.queryByText('Assessing win probability...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Gemini 2.5 Pro/)).not.toBeInTheDocument();

    resolveAI({
      data: { winProbability: 63, riskLevel: 'low', riskFactors: [], opportunities: ['Upsell'], nextSteps: ['Do X'], timelineEstimate: '3 weeks', competitivePosition: 'Strong' },
    });
    expect(await screen.findByText('Refresh Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Analyzing deal...')).not.toBeInTheDocument();
    expect(screen.getByText('3 weeks')).toBeInTheDocument();
  });

  it('shows the real error instead of a made-up analysis', async () => {
    render(<LiveDealAnalysis />);
    await userEvent.click(screen.getByText('Analyze Deal'));
    rejectAI(new Error('Add your OpenAI API key in Settings → API Keys.'));
    expect(await screen.findByText(/AI analysis unavailable: Add your OpenAI API key/)).toBeInTheDocument();
    expect(screen.queryByText('Refresh Analysis')).not.toBeInTheDocument();
  });

  it('uses no sample deal when the user has none', () => {
    state.deals = [];
    render(<LiveDealAnalysis />);
    expect(screen.getByText(/No deals yet/)).toBeInTheDocument();
    expect(screen.queryByText('Analyze Deal')).not.toBeInTheDocument();
  });
});
