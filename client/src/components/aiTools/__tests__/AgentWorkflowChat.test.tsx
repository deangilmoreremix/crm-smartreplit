import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const ai = {
  createConversation: vi.fn(),
  sendConversationMessage: vi.fn(),
  generateAI: vi.fn(),
};
vi.mock('../../../services/aiGenerate', () => ({
  createConversation: (...a: any[]) => ai.createConversation(...a),
  sendConversationMessage: (...a: any[]) => ai.sendConversationMessage(...a),
  generateAI: (...a: any[]) => ai.generateAI(...a),
}));

import AgentWorkflowChat from '../AgentWorkflowChat';

const send = async (text: string) => {
  await userEvent.type(screen.getByPlaceholderText(/Describe the workflow/), text);
  await userEvent.click(document.querySelector('button[type="submit"]') as HTMLElement);
};
const openWorkflowPanel = () => userEvent.click(document.querySelector('button.p-2.bg-white\\/20') as HTMLElement);

describe('AgentWorkflowChat', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn(); // jsdom does not implement it
  });
  beforeEach(() => {
    ai.createConversation.mockReset().mockResolvedValue('conv_1');
    ai.sendConversationMessage.mockReset().mockResolvedValue({ content: 'Sure, here is a plan.', responseId: 'r1' });
    ai.generateAI.mockReset();
  });

  it('shows a plan written by the AI, with no Run control or fake completion', async () => {
    ai.generateAI.mockResolvedValue({
      data: { name: 'Re-engage cold leads', steps: [{ name: 'Find stale leads', action: 'query_crm', description: 'Leads idle 30 days' }, { name: 'Send check-in', action: 'send_email', description: 'Personal note' }] },
    });
    render(<AgentWorkflowChat />);
    await screen.findByText(/AI Workflow Automation Agent/);
    await send('create workflow to re-engage cold leads');
    await openWorkflowPanel();

    expect(await screen.findByText('Find stale leads')).toBeInTheDocument();
    expect(screen.getByText('Send check-in')).toBeInTheDocument();
    expect(ai.generateAI.mock.calls[0][0]).toMatchObject({ schemaName: 'workflow_plan' });
    // the old canned keyword templates are gone
    expect(screen.queryByText('Identify New Leads')).not.toBeInTheDocument();
    expect(screen.queryByText('Send Welcome Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Run')).not.toBeInTheDocument();
    expect(screen.queryByText(/Runs:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/completed successfully/)).not.toBeInTheDocument();
  });

  it('tells the user when the plan cannot be generated instead of showing a canned one', async () => {
    ai.generateAI.mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys.'));
    render(<AgentWorkflowChat />);
    await screen.findByText(/AI Workflow Automation Agent/);
    await send('create workflow for new leads');

    expect(await screen.findByText(/couldn't generate the workflow plan: Add your OpenAI API key/)).toBeInTheDocument();
    expect(screen.queryByText('Identify New Leads')).not.toBeInTheDocument();
  });

  it('shows the error when a chat message fails', async () => {
    ai.sendConversationMessage.mockRejectedValue(new Error('upstream exploded'));
    render(<AgentWorkflowChat />);
    await screen.findByText(/AI Workflow Automation Agent/);
    await send('hello');
    expect(await screen.findByText('upstream exploded')).toBeInTheDocument();
  });
});
