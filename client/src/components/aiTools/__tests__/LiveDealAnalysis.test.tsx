import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveDealAnalysis from '../LiveDealAnalysis';

let resolveInsights: (v: any) => void;
vi.mock('../../../services/openAIService', () => ({
  default: {
    generateDealInsights: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveInsights = resolve;
        })
    ),
  },
}));

describe('LiveDealAnalysis', () => {
  it('shows an indeterminate spinner (no fake step text) while the call is pending', async () => {
    render(<LiveDealAnalysis />);
    await userEvent.click(screen.getByText('Analyze Deal'));
    expect(screen.getByText('Analyzing deal...')).toBeInTheDocument();
    expect(screen.queryByText('Assessing win probability...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Gemini 2.5 Pro/)).not.toBeInTheDocument();

    resolveInsights({ winProbability: 63, riskLevel: 'low', recommendedActions: ['Do X'] });
    expect(await screen.findByText('Refresh Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Analyzing deal...')).not.toBeInTheDocument();
  });
});
