import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../hooks/useContactStore', () => ({
  useContactStore: { getState: () => ({ fetchContacts: vi.fn(async () => {}) }) },
}));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../services/logger.service', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('../../../services/leadAutomationApi', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  scoreContact: vi.fn(),
}));

import BatchProcessingPanel from '../BatchProcessingPanel';
import { scoreContact, NeedsApiKeyError } from '../../../services/leadAutomationApi';

describe('BatchProcessingPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows real results and real errors, with no overnight/50% promises', async () => {
    (scoreContact as any).mockImplementation(async (id: string) => {
      if (id === 'b') throw new NeedsApiKeyError('Add your OpenAI key in Settings');
      return { contactId: 1, score: 88, priority: 'hot', rationale: 'Strong fit', method: 'ai', qualified: true };
    });
    render(<BatchProcessingPanel selectedContactIds={['a', 'b']} />);
    expect(screen.queryByText(/overnight|50%/i)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Score Selected Contacts/i }));

    await waitFor(() => expect(screen.getByText(/1 of 2 scored, 1 failed/)).toBeInTheDocument());
    expect(screen.getByText(/Add your OpenAI key in Settings/)).toBeInTheDocument();
    expect(screen.getByText(/88 \(hot\) - Strong fit/)).toBeInTheDocument();
  });
});
