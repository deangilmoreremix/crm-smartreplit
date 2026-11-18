import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { generateAI, single } = vi.hoisted(() => ({ generateAI: vi.fn(), single: vi.fn() }));

vi.mock('../../services/aiGenerate', () => ({ generateAI }));
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

import GTMIntegration from '../GTMIntegration';

describe('GTMIntegration', () => {
  beforeEach(() => {
    generateAI.mockReset();
    single.mockResolvedValue({
      data: { id: 7, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com', score: 41 },
      error: null,
    });
  });

  it('renders recommendations generated from the loaded contact, without confidence figures', async () => {
    generateAI.mockResolvedValue({
      data: {
        recommendations: [
          { id: 'intro_call', title: 'Book an intro call', category: 'sales', reasoning: 'Ada has a score of 41' },
        ],
      },
    });
    render(<GTMIntegration contactId={7} />);
    await waitFor(() => expect(screen.getByText('Book an intro call')).toBeInTheDocument());
    expect(screen.getByText('Ada has a score of 41')).toBeInTheDocument();
    const call = generateAI.mock.calls[0][0];
    expect(call.prompt).toContain('ada@x.com');
    expect(call.schema.required).toEqual(['recommendations']);
    expect(screen.queryByText(/% confidence/)).toBeNull();
    for (const fake of ['Personalized Follow-up Email', 'Pain Point Discovery', 'Handle Pricing Objections']) {
      expect(screen.queryByText(fake)).toBeNull();
    }
  });

  it('shows the server message when generation fails', async () => {
    generateAI.mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys'));
    render(<GTMIntegration contactId={7} />);
    await waitFor(() =>
      expect(screen.getByText('Add your OpenAI API key in Settings → API Keys')).toBeInTheDocument()
    );
    expect(screen.queryByText('Personalized Follow-up Email')).toBeNull();
  });
});
