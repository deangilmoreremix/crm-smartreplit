import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentWorkflowChat from '../AgentWorkflowChat';

vi.mock('../../../services/openaiAssistantsService', () => ({
  useOpenAIAssistants: () => ({
    createAssistant: vi.fn().mockResolvedValue({ id: 'asst' }),
    createThread: vi.fn().mockResolvedValue({ id: 'thread' }),
    addMessageToThread: vi.fn().mockResolvedValue(undefined),
    runAssistant: vi.fn().mockResolvedValue({ id: 'run' }),
    getRunStatus: vi.fn().mockResolvedValue({ status: 'failed' }),
    getThreadMessages: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

describe('AgentWorkflowChat', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the generated plan without any Run control or fake completion', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentWorkflowChat />);
    await screen.findByText(/AI Workflow Automation Agent/);

    await user.type(
      screen.getByPlaceholderText(/Describe the workflow/),
      'create workflow for new leads'
    );
    await user.click(container.querySelector('button[type="submit"]') as HTMLElement);

    // open the workflow panel (settings button in the header)
    await user.click(container.querySelector('button.p-2.bg-white\\/20') as HTMLElement);
    expect(await screen.findByText('Identify New Leads')).toBeInTheDocument();
    expect(screen.getByText('Send Welcome Email')).toBeInTheDocument();

    expect(screen.queryByText('Run')).not.toBeInTheDocument();
    expect(screen.queryByText(/Runs:/)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/completed successfully/)).not.toBeInTheDocument()
    );
  });
});
