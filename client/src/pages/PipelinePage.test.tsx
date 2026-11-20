import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('../components/DealKanbanBoard', () => ({ default: () => <div>board</div> }));
vi.mock('../components/record-table/DealsTable', () => ({ default: () => <div>table</div> }));
vi.mock('../components/ModuleFederationPipeline', () => ({ default: () => <div>mf</div> }));
vi.mock('../components/GTMIntegration', () => ({ default: () => <div>gtm</div> }));
vi.mock('../hooks/useContactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../hooks/use-toast', () => ({ toast: vi.fn() }));

import PipelinePage from './PipelinePage';
import { useDealStore } from '../store/dealStore';

const Where = () => <div data-testid="loc">{useLocation().search}</div>;
const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PipelinePage />
      <Where />
    </MemoryRouter>
  );

describe('PipelinePage create-deal deep link', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 99 }) }));
    useDealStore.setState({ realDeals: [], demoEnabled: false });
  });

  it('does not show the dialog without ?new=1', () => {
    renderAt('/pipeline');
    expect(screen.queryByText('Create Deal')).toBeNull();
  });

  it('opens on ?new=1, creates the deal on the server and clears the param', async () => {
    renderAt('/pipeline?new=1');
    expect(screen.getByText('Create Deal')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Acme renewal' } });
    fireEvent.change(screen.getByLabelText(/Value/), { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create deal' }));
    await waitFor(() => expect(screen.getByTestId('loc').textContent).toBe(''));
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('/api/deals');
    expect(JSON.parse(init.body)).toMatchObject({ title: 'Acme renewal', value: '1500' });
    expect(useDealStore.getState().realDeals.map((d) => d.id)).toEqual(['99']);
  });

  it('clears the param when cancelled', () => {
    renderAt('/pipeline?new=1');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByTestId('loc').textContent).toBe('');
  });
});
