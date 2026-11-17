import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { generateSalesForecast, state } = vi.hoisted(() => ({
  generateSalesForecast: vi.fn(),
  state: { deals: [] as any[] },
}));
vi.mock('../../../services/edgeFunctionService', () => ({ generateSalesForecast }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: state.deals }) }));

import SalesForecastContent from '../SalesForecastContent';

describe('SalesForecastContent', () => {
  beforeEach(() => {
    generateSalesForecast.mockReset();
    state.deals = [
      { id: '1', title: 'Rocket Deal', value: 20000, stage: { id: 'proposal', name: 'Proposal' }, probability: 50 },
    ];
  });

  it('forecasts from the real deals and lists them', async () => {
    generateSalesForecast.mockResolvedValue('Real forecast text');
    render(<SalesForecastContent />);
    expect(screen.getByText(/Rocket Deal: \$20,000 \(Proposal, 50% probability\)/)).toBeInTheDocument();
    expect(screen.getByText(/Total pipeline: \$20,000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sales Forecast' }));
    await waitFor(() => expect(generateSalesForecast).toHaveBeenCalled());
    const [deals] = generateSalesForecast.mock.calls[0];
    expect(deals).toEqual([{ title: 'Rocket Deal', value: 20000, stage: 'Proposal', probability: 50 }]);
    expect(document.body.textContent).not.toMatch(/Enterprise License|\$290,000|Sample Pipeline/);
  });

  it('shows the server message on failure', async () => {
    generateSalesForecast.mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys'));
    render(<SalesForecastContent />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sales Forecast' }));
    await waitFor(() =>
      expect(screen.getAllByText('Add your OpenAI API key in Settings → API Keys').length).toBeGreaterThan(0)
    );
  });

  it('shows an empty state and disables generation when there are no deals', () => {
    state.deals = [];
    render(<SalesForecastContent />);
    expect(screen.getByText(/No deals yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Sales Forecast' })).toBeDisabled();
  });
});
