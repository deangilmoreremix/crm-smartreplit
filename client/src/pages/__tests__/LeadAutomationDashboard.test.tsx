import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const now = new Date().toISOString();
const contact = (id: string, first: string, status: string, extra: any = {}) => ({
  id,
  firstName: first,
  lastName: 'Doe',
  name: `${first} Doe`,
  email: `${first.toLowerCase()}@acme.co`,
  company: 'Acme',
  status,
  source: 'Website',
  tags: [],
  createdAt: now,
  aiScore: 0,
  ...extra,
});
const contactsState = {
  contacts: { '1': contact('1', 'Jane', 'lead'), '2': contact('2', 'Bob', 'customer') } as Record<string, any>,
  fetchContacts: vi.fn(async () => {}),
};

vi.mock('../../hooks/useContactStore', () => ({ useContactStore: () => contactsState }));
vi.mock('../../store/dealStore', () => ({ useDealStore: () => ({ deals: {} }) }));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../services/aiGenerate', () => ({ generateAI: vi.fn() }));
vi.mock('../../services/leadAutomationApi', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  scoreContact: vi.fn(),
  listCampaigns: vi.fn(),
  getCampaign: vi.fn(),
  createCampaign: vi.fn(),
  setCampaignStatus: vi.fn(),
  deleteCampaign: vi.fn(),
  processDueSteps: vi.fn(),
}));
// Radix Select needs pointer APIs jsdom lacks; a native <select> keeps the tests about behaviour
vi.mock('@/components/ui/select', async () => {
  const React = await import('react');
  const Ctx = React.createContext<any>({});
  return {
    Select: ({ value, onValueChange, children }: any) => <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>,
    SelectTrigger: () => null,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => {
      const { value, onValueChange } = React.useContext(Ctx);
      return (
        <select value={value ?? ''} onChange={(e) => onValueChange?.(e.target.value)}>
          <option value="" />
          {children}
        </select>
      );
    },
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  };
});

import LeadAutomationDashboard from '../LeadAutomationDashboard';
import * as api from '../../services/leadAutomationApi';
import { generateAI } from '../../services/aiGenerate';

const campaign = {
  id: 'c1',
  name: 'Welcome',
  description: 'Warm up new leads',
  status: 'active' as const,
  audience: {},
  steps: [
    { day: 0, channel: 'email' as const, title: 'Intro', message: 'Hello' },
    { day: 3, channel: 'call' as const, title: 'Call', message: 'Ring' },
  ],
  leads: 2,
  converted: 1,
  conversionRate: 0.5,
};
const settings = { scoringModel: 'ai-powered' as const, qualificationThreshold: 70, createFollowupTasks: true };

const openTab = async (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('LeadAutomationDashboard', () => {
  beforeEach(() => {
    vi.mocked(api.processDueSteps).mockResolvedValue({ tasksCreated: 0 });
    vi.mocked(api.listCampaigns).mockResolvedValue([campaign]);
    vi.mocked(api.getSettings).mockResolvedValue(settings);
    vi.mocked(api.saveSettings).mockImplementation(async (s) => ({ ...settings, ...s }) as any);
    vi.mocked(api.setCampaignStatus).mockResolvedValue({ ...campaign, status: 'paused' });
    vi.mocked(api.deleteCampaign).mockResolvedValue({ success: true });
    vi.mocked(api.createCampaign).mockResolvedValue({ campaign: campaign as any, enrolled: 2, tasksCreated: 2 });
  });

  it('shows campaigns from the API with computed stats and no budget numbers', async () => {
    render(<LeadAutomationDashboard />);
    await openTab('Campaigns');
    const card = await screen.findByTestId('campaign-card');
    expect(within(card).getByText('Welcome')).toBeInTheDocument();
    expect(card).toHaveTextContent('Leads:2');
    expect(card).toHaveTextContent('Conversion:50%');
    expect(card).toHaveTextContent('Steps:2');
    expect(card).not.toHaveTextContent(/budget|spent/i);
    expect(api.processDueSteps).toHaveBeenCalled();
  });

  it('pauses and deletes a campaign through the API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<LeadAutomationDashboard />);
    await openTab('Campaigns');
    await userEvent.click(await screen.findByLabelText('Pause Welcome'));
    expect(api.setCampaignStatus).toHaveBeenCalledWith('c1', 'paused');
    await userEvent.click(screen.getByLabelText('Delete Welcome'));
    expect(api.deleteCampaign).toHaveBeenCalledWith('c1');
  });

  it('creates a campaign from the dialog and reports what happened', async () => {
    render(<LeadAutomationDashboard />);
    await userEvent.click(screen.getByRole('button', { name: /create campaign/i }));
    await userEvent.type(await screen.findByLabelText('Name'), 'Spring push');
    await userEvent.click(screen.getByRole('button', { name: /add step/i }));
    await userEvent.type(screen.getByLabelText('Step 1 title'), 'Intro email');
    expect(screen.getByTestId('audience-count')).toHaveTextContent('2 contacts match');
    await userEvent.click(screen.getByRole('button', { name: 'Create campaign' }));

    await waitFor(() =>
      expect(api.createCampaign).toHaveBeenCalledWith({
        name: 'Spring push',
        description: undefined,
        audience: { statuses: [], sources: [], tags: [] },
        steps: [{ day: 0, channel: 'email', title: 'Intro email', message: '' }],
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('2 contact(s) enrolled, 2 task(s) created');
  });

  it('refuses to create a campaign without steps', async () => {
    render(<LeadAutomationDashboard />);
    await userEvent.click(screen.getByRole('button', { name: /create campaign/i }));
    await userEvent.type(await screen.findByLabelText('Name'), 'Empty');
    await userEvent.click(screen.getByRole('button', { name: 'Create campaign' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one step/i);
    expect(api.createCampaign).not.toHaveBeenCalled();
  });

  it('generates campaign steps with AI using a strict JSON schema', async () => {
    vi.mocked(generateAI).mockResolvedValue({
      content: '',
      sources: [],
      model: 'm',
      data: { steps: [{ day: 2, channel: 'sms', title: 'Check-in text', message: 'Hi!' }, { day: 0, channel: 'email', title: 'Welcome email', message: 'Welcome' }] },
    });
    render(<LeadAutomationDashboard />);
    await userEvent.click(screen.getByRole('button', { name: /create campaign/i }));
    await userEvent.type(await screen.findByLabelText('Name'), 'Welcome');
    await userEvent.click(screen.getByRole('button', { name: /generate steps with ai/i }));

    await waitFor(() => expect(screen.getAllByTestId('campaign-step')).toHaveLength(2));
    expect(vi.mocked(generateAI).mock.calls[0][0]).toMatchObject({ schemaName: 'campaign_steps', schema: api.STEP_SCHEMA });
    expect(screen.getByLabelText('Step 1 title')).toHaveValue('Welcome email'); // sorted by day
  });

  it('scores the chosen contact and shows the saved result', async () => {
    vi.mocked(api.scoreContact).mockResolvedValue({ contactId: 1, score: 82, priority: 'hot', rationale: 'Strong fit', method: 'ai-powered', qualified: true });
    render(<LeadAutomationDashboard />);
    await openTab('AI Tools');
    const calc = screen.getByRole('button', { name: /calculate lead score/i });
    expect(calc).toBeDisabled();
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
    await userEvent.click(calc);

    const result = await screen.findByTestId('score-result');
    expect(api.scoreContact).toHaveBeenCalledWith('1');
    expect(result).toHaveTextContent('82/100');
    expect(result).toHaveTextContent('marked qualified');
    expect(result).toHaveTextContent('Strong fit');
    expect(contactsState.fetchContacts).toHaveBeenCalled();
  });

  it('shows the server message when scoring needs an OpenAI key', async () => {
    vi.mocked(api.scoreContact).mockRejectedValue(new api.NeedsApiKeyError('Add your OpenAI API key in Settings → API Keys.'));
    render(<LeadAutomationDashboard />);
    await openTab('AI Tools');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
    await userEvent.click(screen.getByRole('button', { name: /calculate lead score/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Add your OpenAI API key');
    expect(screen.queryByTestId('score-result')).not.toBeInTheDocument();
  });

  it('turns a generated sequence into a campaign draft', async () => {
    vi.mocked(generateAI).mockResolvedValue({
      content: '',
      sources: [],
      model: 'm',
      data: { steps: [{ day: 0, channel: 'email', title: 'Day 0 email', message: 'Hello' }] },
    });
    render(<LeadAutomationDashboard />);
    await openTab('AI Tools');
    await userEvent.type(screen.getByLabelText('Sequence Name'), 'Re-warm cold leads');
    await userEvent.click(screen.getByRole('button', { name: /create ai sequence/i }));
    await screen.findByTestId('sequence-preview');
    expect(vi.mocked(generateAI).mock.calls[0][0]).toMatchObject({ schemaName: 'sequence_steps' });

    await userEvent.click(screen.getByRole('button', { name: 'Save as campaign' }));
    expect(await screen.findByLabelText('Name')).toHaveValue('Re-warm cold leads');
    expect(screen.getAllByLabelText('Step 1 title').some((el) => (el as HTMLInputElement).value === 'Day 0 email')).toBe(true);
  });

  it('asks for a sequence name or audience before calling the AI', async () => {
    render(<LeadAutomationDashboard />);
    await openTab('AI Tools');
    await userEvent.click(screen.getByRole('button', { name: /create ai sequence/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/name or describe/i);
    expect(generateAI).not.toHaveBeenCalled();
  });

  it('loads and saves settings', async () => {
    render(<LeadAutomationDashboard />);
    await openTab('Settings');
    const threshold = await screen.findByLabelText(/auto-qualification threshold/i);
    expect(threshold).toHaveValue(70);
    await userEvent.clear(threshold);
    await userEvent.type(threshold, '85');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(api.saveSettings).toHaveBeenCalledWith({ ...settings, qualificationThreshold: 85 }));
    expect(await screen.findByRole('status')).toHaveTextContent('Settings saved');
  });

  it('builds the conversion funnel from real contacts, not fixed numbers', async () => {
    render(<LeadAutomationDashboard />);
    await openTab('Analytics');
    const funnel = (await screen.findByText('Conversion Funnel')).closest('div')!.parentElement!.parentElement!;
    expect(within(funnel).getByText('New').nextSibling).toHaveTextContent('1');
    expect(within(funnel).getByText('Converted').nextSibling).toHaveTextContent('1');
    expect(document.body).not.toHaveTextContent('1,250');
    expect(document.body).not.toHaveTextContent('John Smith');
  });
});
