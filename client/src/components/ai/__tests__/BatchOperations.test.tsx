import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartAIControls } from '../SmartAIControls';

const { enrichContactsBulk } = vi.hoisted(() => ({ enrichContactsBulk: vi.fn() }));

vi.mock('../../../hooks/useSmartAI', () => ({
  useSmartAI: () => ({
    smartScoreContact: vi.fn(),
    smartEnrichContact: vi.fn(),
    smartCategorizeAndTag: vi.fn(),
    smartQualifyLead: vi.fn(),
    smartBulkAnalysis: vi.fn(),
    analyzing: false,
    enriching: false,
    results: {},
    errors: {},
  }),
  useTaskOptimization: () => ({
    getRecommendations: () => null,
    getInsights: () => null,
    performance: null,
  }),
}));

vi.mock('../../../services/openai-batch-api.service', () => ({
  batchAPIService: { enrichContactsBulk },
}));

const makeContacts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `ct-${i + 1}`, name: `Contact ${i + 1}` })) as any[];

describe('Bulk Operations (batch API)', () => {
  const contacts = makeContacts(3);

  beforeEach(() => {
    enrichContactsBulk.mockReset();
  });

  it('renders bulk analysis panel with the selected contacts', () => {
    render(<SmartAIControls contacts={contacts} />);
    expect(screen.getByText('Smart Bulk Analysis (3 contacts)')).toBeInTheDocument();
    expect(screen.getByText('Immediate Bulk Analysis (3 contacts)')).toBeInTheDocument();
  });

  it('does not render the bulk panel when fewer than two contacts are provided', () => {
    render(<SmartAIControls contacts={makeContacts(1)} />);
    expect(screen.queryByText(/Smart Bulk Analysis/)).not.toBeInTheDocument();
  });

  it('triggers immediate bulk enrichment when button clicked', async () => {
    enrichContactsBulk.mockResolvedValue({ jobId: 'job-123', success: true });
    render(<SmartAIControls contacts={contacts} />);
    await userEvent.click(screen.getByText('Immediate Bulk Analysis (3 contacts)'));
    await waitFor(() => {
      expect(enrichContactsBulk).toHaveBeenCalledWith(
        ['ct-1', 'ct-2', 'ct-3'],
        ['contact_scoring'],
        { processingMode: 'immediate' }
      );
    });
  });

  it('queues an overnight batch when button clicked', async () => {
    enrichContactsBulk.mockResolvedValue({ jobId: 'job-456', success: true });
    render(<SmartAIControls contacts={contacts} />);
    await userEvent.click(screen.getByText(/Overnight Batch Analysis/));
    await waitFor(() => {
      expect(enrichContactsBulk).toHaveBeenCalledWith(
        ['ct-1', 'ct-2', 'ct-3'],
        ['contact_scoring'],
        { processingMode: 'overnight' }
      );
    });
  });

  it('uses the selected analysis type', async () => {
    enrichContactsBulk.mockResolvedValue({ success: true });
    render(<SmartAIControls contacts={contacts} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'tagging');
    await userEvent.click(screen.getByText('Immediate Bulk Analysis (3 contacts)'));
    await waitFor(() => {
      expect(enrichContactsBulk).toHaveBeenCalledWith(['ct-1', 'ct-2', 'ct-3'], ['tagging'], {
        processingMode: 'immediate',
      });
    });
  });

  it('shows progress indicator and disables buttons during operations', async () => {
    enrichContactsBulk.mockImplementation(() => new Promise(() => {}));
    render(<SmartAIControls contacts={contacts} />);
    await userEvent.click(screen.getByText('Immediate Bulk Analysis (3 contacts)'));
    expect(screen.getByText('Processing 3 contacts...')).toBeInTheDocument();
    expect(screen.getByText('Processing 3 contacts...').closest('button')).toBeDisabled();
    expect(screen.getByText('Queueing 3 contacts...').closest('button')).toBeDisabled();
  });

  it('returns to idle state after completion', async () => {
    enrichContactsBulk.mockResolvedValue({ jobId: 'job-123', success: true });
    render(<SmartAIControls contacts={contacts} />);
    await userEvent.click(screen.getByText('Immediate Bulk Analysis (3 contacts)'));
    await waitFor(() => {
      expect(screen.getByText('Immediate Bulk Analysis (3 contacts)')).toBeInTheDocument();
    });
    expect(screen.queryByText('Processing 3 contacts...')).not.toBeInTheDocument();
  });
});
