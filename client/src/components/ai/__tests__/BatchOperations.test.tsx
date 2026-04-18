import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartAIControls from '../../ai/SmartAIControls';

vi.mock('../../store/aiIntegrationStore', () => ({
  useAIIntegrationStore: () => ({
    batchAnalyzeContacts: vi.fn(),
    bulkEnrichContacts: vi.fn(),
    enriching: false,
    selectedContactIds: [],
  }),
}));

describe('Bulk Operations Demonstration', () => {
  const mockContactIds = ['ct-1', 'ct-2', 'ct-3'];
  
  let batchAnalyzeContactsMock;
  let bulkEnrichContactsMock;

  beforeEach(() => {
    batchAnalyzeContactsMock = useAIIntegrationStore.mock.results[0].value.batchAnalyzeContacts;
    bulkEnrichContactsMock = useAIIntegrationStore.mock.results[0].value.bulkEnrichContacts;
    vi.clearAllMocks();
  });

  it('renders bulk operations panel with selected contacts', () => {
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    expect(screen.getByText('Selected: 3 contacts')).toBeInTheDocument();
  });

  it('triggers bulk enrichment when button clicked', async () => {
    bulkEnrichContactsMock.mockResolvedValue({ jobId: 'job-123', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Bulk Enrich Contacts'));
    await waitFor(() => {
      expect(bulkEnrichContactsMock).toHaveBeenCalledWith(mockContactIds, ['scoring', 'social', 'personality']);
    });
  });

  it('triggers batch analysis when button clicked', async () => {
    batchAnalyzeContactsMock.mockResolvedValue({ jobId: 'job-456', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Batch Analyze Contacts'));
    await waitFor(() => {
      expect(batchAnalyzeContactsMock).toHaveBeenCalledWith(mockContactIds);
    });
  });

  it('triggers social research when button clicked', async () => {
    bulkEnrichContactsMock.mockResolvedValue({ jobId: 'job-789', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Research Social Profiles'));
    await waitFor(() => {
      expect(bulkEnrichContactsMock).toHaveBeenCalledWith(mockContactIds, ['social']);
    });
  });

  it('disables buttons when no contacts selected', () => {
    render(<SmartAIControls selectedContactIds={[]} />);
    expect(screen.getByText('Bulk Enrich Contacts')).toBeDisabled();
    expect(screen.getByText('Batch Analyze Contacts')).toBeDisabled();
    expect(screen.getByText('Research Social Profiles')).toBeDisabled();
  });

  it('shows progress indicator during operations', async () => {
    bulkEnrichContactsMock.mockImplementation(() => new Promise(() => {}));
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Bulk Enrich Contacts'));
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('updates progress after completion', async () => {
    const result = {
      jobId: 'job-123',
      completed: 3,
      total: 3,
      success: 3,
      failed: 0,
    };
    bulkEnrichContactsMock.mockResolvedValue(result);
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Bulk Enrich Contacts'));
    await waitFor(() => {
      expect(screen.getByText('Completed: 3/3')).toBeInTheDocument();
    });
  });
});
