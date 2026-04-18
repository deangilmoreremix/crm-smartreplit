import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Bulk Operations Tests', () => {
  const mockContactIds = ['ct-1', 'ct-2', 'ct-3'];
  let batchAnalyzeMock;
  let bulkEnrichMock;

  beforeEach(() => {
    batchAnalyzeMock = useAIIntegrationStore.mock.results[0].value.batchAnalyzeContacts;
    bulkEnrichMock = useAIIntegrationStore.mock.results[0].value.bulkEnrichContacts;
    vi.clearAllMocks();
  });

  it('renders bulk operations panel', () => {
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    expect(screen.getByText('Selected: 3 contacts')).toBeInTheDocument();
  });

  it('triggers bulk enrichment', async () => {
    bulkEnrichMock.mockResolvedValue({ jobId: 'job-1', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Bulk Enrich Contacts'));
    await waitFor(() => {
      expect(bulkEnrichMock).toHaveBeenCalledWith(mockContactIds, [
        'scoring',
        'social',
        'personality',
      ]);
    });
  });

  it('triggers batch analysis', async () => {
    batchAnalyzeMock.mockResolvedValue({ jobId: 'job-2', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Batch Analyze Contacts'));
    await waitFor(() => {
      expect(batchAnalyzeMock).toHaveBeenCalledWith(mockContactIds);
    });
  });

  it('triggers social research', async () => {
    bulkEnrichMock.mockResolvedValue({ jobId: 'job-3', success: true });
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Research Social Profiles'));
    await waitFor(() => {
      expect(bulkEnrichMock).toHaveBeenCalledWith(mockContactIds, ['social']);
    });
  });

  it('disables buttons when no contacts selected', () => {
    render(<SmartAIControls selectedContactIds={[]} />);
    expect(screen.getByText('Bulk Enrich Contacts')).toBeDisabled();
    expect(screen.getByText('Batch Analyze Contacts')).toBeDisabled();
    expect(screen.getByText('Research Social Profiles')).toBeDisabled();
  });

  it('shows progress during operations', async () => {
    bulkEnrichMock.mockImplementation(() => new Promise(() => {}));
    render(<SmartAIControls selectedContactIds={mockContactIds} />);
    await userEvent.click(screen.getByText('Bulk Enrich Contacts'));
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
