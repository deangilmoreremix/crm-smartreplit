import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartAIControls } from '../SmartAIControls';

const { smartScoreContact, smartQualifyLead } = vi.hoisted(() => ({
  smartScoreContact: vi.fn(),
  smartQualifyLead: vi.fn(),
}));

vi.mock('../../../hooks/useSmartAI', () => ({
  useSmartAI: () => ({
    smartScoreContact,
    smartEnrichContact: vi.fn(),
    smartCategorizeAndTag: vi.fn(),
    smartQualifyLead,
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
  batchAPIService: { enrichContactsBulk: vi.fn() },
}));

const contact = { id: 'ct-1', name: 'Ada Lovelace' } as any;

describe('SmartAIControls', () => {
  beforeEach(() => {
    smartScoreContact.mockReset();
    smartQualifyLead.mockReset();
  });

  it('renders nothing actionable without a contact or contacts', () => {
    render(<SmartAIControls />);
    expect(screen.queryByText(/Smart AI Analysis/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Smart Bulk Analysis/)).not.toBeInTheDocument();
  });

  it('renders the single-contact panel with all operations', () => {
    render(<SmartAIControls contact={contact} />);
    expect(screen.getByText('Smart AI Analysis - Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Smart Scoring')).toBeInTheDocument();
    expect(screen.getByText('Lead Qualification')).toBeInTheDocument();
  });

  it('runs smart scoring with the chosen urgency and reports the result', async () => {
    const onAnalysisComplete = vi.fn();
    smartScoreContact.mockResolvedValue({ score: 80 });
    render(<SmartAIControls contact={contact} onAnalysisComplete={onAnalysisComplete} />);
    await userEvent.click(screen.getByText('High'));
    await userEvent.click(screen.getByText('Run Smart Scoring'));
    await waitFor(() => {
      expect(smartScoreContact).toHaveBeenCalledWith('ct-1', contact, 'high');
    });
    expect(onAnalysisComplete).toHaveBeenCalledWith({ score: 80 });
  });

  it('runs lead qualification when that operation is selected', async () => {
    smartQualifyLead.mockResolvedValue({ qualified: true });
    render(<SmartAIControls contact={contact} />);
    await userEvent.click(screen.getByText('Lead Qualification'));
    await userEvent.click(screen.getByText('Run Lead Qualification'));
    await waitFor(() => {
      expect(smartQualifyLead).toHaveBeenCalledWith('ct-1', contact);
    });
  });

  it('shows the bulk panel only when more than one contact is provided', () => {
    const { rerender } = render(<SmartAIControls contacts={[contact]} />);
    expect(screen.queryByText(/Smart Bulk Analysis/)).not.toBeInTheDocument();
    rerender(<SmartAIControls contacts={[contact, { id: 'ct-2', name: 'Grace' } as any]} />);
    expect(screen.getByText('Smart Bulk Analysis (2 contacts)')).toBeInTheDocument();
  });
});
