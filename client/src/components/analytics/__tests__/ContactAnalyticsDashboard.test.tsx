import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const contact = (id: string, first: string, extra: any = {}) => ({
  id,
  name: `${first} Doe`,
  email: `${first.toLowerCase()}@acme.co`,
  phone: '555',
  company: 'Acme',
  tags: [],
  createdAt: now,
  updatedAt: now,
  notes: 'n',
  ...extra,
});
const contactsState = {
  contacts: {
    '1': contact('1', 'Jane', { lastContact: daysAgo(2) }),
    '2': contact('2', 'Bob', { lastContact: daysAgo(15) }),
    '3': contact('3', 'Cy', { lastContact: daysAgo(90), updatedAt: daysAgo(90) }),
    '4': contact('4', 'Di', { lastContact: daysAgo(1) }),
  } as Record<string, any>,
  fetchContacts: vi.fn(async () => {}),
};

vi.mock('@/hooks/useContactStore', () => ({ useContactStore: () => contactsState }));
// Stable references: the component's effect depends on `deals`, a fresh object each render would loop forever
const dealsState = { deals: {} };
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => dealsState }));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../services/ai-intelligence-engine.service', () => ({ aiIntelligenceEngine: {} }));
vi.mock('../../../services/leadAutomationApi', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  scoreContact: vi.fn(),
}));

import ContactAnalyticsDashboard from '../ContactAnalyticsDashboard';
import * as api from '../../../services/leadAutomationApi';

const openIntelligence = () => userEvent.click(screen.getByRole('button', { name: 'AI Intelligence' }));

describe('ContactAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts the engagement chart from each contact's recency, not a fixed split", () => {
    render(<ContactAnalyticsDashboard />);
    const levels = screen.getByTestId('engagement-levels');
    // 2 contacts touched <7 days ago, 1 within 30 days, 1 older
    expect(levels).toHaveTextContent('2High');
    expect(levels).toHaveTextContent('1Medium');
    expect(levels).toHaveTextContent('1Low');
  });

  it('scores every contact with the real API (3 at a time), shows its results and refreshes the store', async () => {
    let running = 0;
    let maxRunning = 0;
    vi.mocked(api.scoreContact).mockImplementation(async (id) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return { contactId: Number(id), score: 70 + Number(id), priority: 'hot', rationale: `Reason ${id}`, method: 'ai-powered', qualified: true };
    });
    render(<ContactAnalyticsDashboard />);
    await userEvent.click(screen.getByRole('button', { name: 'Analyze Contacts' }));
    await openIntelligence();

    expect(await screen.findByText('Reason 1')).toBeInTheDocument();
    expect(api.scoreContact).toHaveBeenCalledTimes(4);
    expect(maxRunning).toBeLessThanOrEqual(3);
    expect(screen.getByText('71/100')).toBeInTheDocument();
    expect(contactsState.fetchContacts).toHaveBeenCalled();
    expect(document.body).not.toHaveTextContent('Predicted Value');
    expect(document.body).not.toHaveTextContent('Enrichment Score');
    expect(document.body).not.toHaveTextContent('$10,000');
  });

  it('shows the server message when scoring needs an OpenAI key and stops', async () => {
    vi.mocked(api.scoreContact).mockRejectedValue(new api.NeedsApiKeyError('Add your OpenAI API key in Settings → API Keys.'));
    render(<ContactAnalyticsDashboard />);
    await userEvent.click(screen.getByRole('button', { name: 'Analyze Contacts' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Add your OpenAI API key');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Analyze Contacts' })).toBeEnabled());
    expect(vi.mocked(api.scoreContact).mock.calls.length).toBeLessThanOrEqual(3);
    expect(contactsState.fetchContacts).not.toHaveBeenCalled();
    await openIntelligence();
    expect(screen.getByText('No Intelligence Data')).toBeInTheDocument();
  });
});
