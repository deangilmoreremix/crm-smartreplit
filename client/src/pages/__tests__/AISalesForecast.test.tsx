import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const deals = {
  a: { id: 'a', title: 'Alpha', value: 100000, stage: 'proposal', probability: 50 },
  b: { id: 'b', title: 'Beta', value: 50000, stage: 'qualified', probability: 20 },
  c: { id: 'c', title: 'Gamma', value: 999999, stage: 'closed-won', probability: 100 },
};

vi.mock('../../components/PageLayout', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../store/dealStore', () => ({ useDealStore: () => ({ deals }) }));
vi.mock('../../hooks/useContactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
const forecastState: { loading: boolean; error: string | null; forecast: any; getForecast: any } = {
  loading: false,
  error: null,
  forecast: undefined,
  getForecast: vi.fn(),
};
vi.mock('../../hooks/useAIAnalysis', () => ({ useSalesForecast: () => forecastState }));

import AISalesForecast from '../AISalesForecast';

describe('AISalesForecast', () => {
  beforeEach(() => {
    forecastState.error = null;
    forecastState.forecast = undefined;
  });

  it('without an AI forecast shows the weighted pipeline from the deals and no invented scenarios, confidence or grade', () => {
    render(<AISalesForecast />);
    // 100000*0.5 + 50000*0.2 = 60,000
    expect(screen.getByText('$60,000')).toBeInTheDocument();
    expect(screen.getByText('Weighted Pipeline')).toBeInTheDocument();
    // 0.8x / 0.3x of the 150,000 pipeline and the old "85%" default must be gone
    expect(document.body).not.toHaveTextContent('$120,000');
    expect(document.body).not.toHaveTextContent('$45,000');
    expect(document.body).not.toHaveTextContent('85%');
    expect(document.body).not.toHaveTextContent('High confidence prediction');
    expect(document.body).not.toHaveTextContent('Strong pipeline health');
    expect(screen.getAllByText('--').length).toBeGreaterThan(0); // confidence, grade, best and worst case are blank
    expect(screen.getByText('$150,000')).toBeInTheDocument(); // real active pipeline
  });

  it('shows the AI forecast numbers and its own confidence when available', () => {
    forecastState.forecast = { weighted_forecast: 70000, best_case: 90000, worst_case: 40000, confidence_level: 72, risk_factors: ['Slow Beta'] };
    render(<AISalesForecast />);
    expect(screen.getByText('$70,000')).toBeInTheDocument();
    expect(screen.getByText('$90,000')).toBeInTheDocument();
    expect(screen.getByText('$40,000')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('B+')).toBeInTheDocument();
    expect(screen.getByText('1 risk factor(s) flagged')).toBeInTheDocument();
  });

  it('shows the error message when the AI forecast fails and still shows real deal data', () => {
    forecastState.error = 'Add your OpenAI API key in Settings → API Keys.';
    render(<AISalesForecast />);
    expect(screen.getByRole('alert')).toHaveTextContent('Add your OpenAI API key');
    expect(screen.getByText('$60,000')).toBeInTheDocument();
  });
});
