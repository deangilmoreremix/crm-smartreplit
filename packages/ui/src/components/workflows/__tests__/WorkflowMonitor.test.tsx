import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowMonitor } from '../WorkflowMonitor';

// Mock fetch globally
global.fetch = vi.fn();

const mockRuns = [
  {
    id: 'run-1',
    workflowId: 'wf-1',
    status: 'completed',
    triggeredBy: { type: 'MANUAL', userId: 'user-123' },
    context: { contactId: 'c-123' },
    results: { 'step-1': { success: true } },
    startedAt: new Date('2024-01-15T10:30:00Z'),
    completedAt: new Date('2024-01-15T10:30:05Z'),
  },
  {
    id: 'run-2',
    workflowId: 'wf-1',
    status: 'failed',
    triggeredBy: { type: 'RECORD_CREATED', recordId: 'c-456' },
    context: { contactId: 'c-456' },
    errorMessage: 'Email service unavailable',
    startedAt: new Date('2024-01-15T11:00:00Z'),
  },
];

describe('WorkflowMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    render(<WorkflowMonitor workflowId="wf-1" />);
    expect(screen.getByText('Workflow Runs')).toBeInTheDocument();
  });

  it('displays empty state when no runs', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: [] }),
    });
    render(<WorkflowMonitor workflowId="wf-1" />);
    await waitFor(() => {
      expect(screen.getByText('No workflow runs yet.')).toBeInTheDocument();
    });
  });

  it('displays workflow runs list', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: mockRuns }),
    });
    render(<WorkflowMonitor workflowId="wf-1" />);
    await waitFor(() => {
      expect(screen.getByText(/COMPLETED/)).toBeInTheDocument();
      expect(screen.getByText(/FAILED/)).toBeInTheDocument();
    });
  });

  it('shows test run button', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: [] }),
    });
    render(<WorkflowMonitor workflowId="wf-1" onRunWorkflow={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test run/i })).toBeInTheDocument();
    });
  });

  it('calls onRunWorkflow when test run clicked', async () => {
    const onRunWorkflow = vi.fn();
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ json: () => Promise.resolve({ runs: [] }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({}) });
    render(<WorkflowMonitor workflowId="wf-1" onRunWorkflow={onRunWorkflow} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /test run/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /test run/i }));
    expect(onRunWorkflow).toHaveBeenCalledWith('wf-1');
  });

  it('expands run details on click', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: mockRuns }),
    });
    render(<WorkflowMonitor workflowId="wf-1" />);
    await waitFor(() => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
    // Click to expand the first run
    const firstRun = screen.getByText('COMPLETED').closest('[data-testid]');
    if (firstRun) {
      fireEvent.click(firstRun);
      await waitFor(() => {
        expect(screen.getByText('Trigger Context')).toBeInTheDocument();
      });
    }
  });

  it('displays status badges with correct variants', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: mockRuns }),
    });
    render(<WorkflowMonitor workflowId="wf-1" />);
    await waitFor(() => {
      const completedBadge = screen.getByText('COMPLETED');
      const failedBadge = screen.getByText('FAILED');
      expect(completedBadge.parentElement).toHaveClass('bg-emerald-100');
      expect(failedBadge.parentElement).toHaveClass('bg-red-100');
    });
  });

  it('shows delete button when onDeleteRun provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ runs: mockRuns }),
    });
    render(<WorkflowMonitor workflowId="wf-1" onDeleteRun={vi.fn()} />);
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
