import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { generateAI } = vi.hoisted(() => ({ generateAI: vi.fn() }));
vi.mock('../../../services/aiGenerate', () => ({ generateAI }));

import SubjectLineContent from '../SubjectLineContent';

const fill = () => {
  const [purpose, audience] = screen.getAllByRole('combobox');
  fireEvent.change(purpose, { target: { name: 'purpose', value: 'follow-up' } });
  fireEvent.change(audience, { target: { name: 'audience', value: 'leads' } });
  fireEvent.change(screen.getByLabelText('Key Message or Offer'), {
    target: { name: 'keyMessage', value: 'Our spring demo' },
  });
  fireEvent.click(screen.getByText('Generate Subject Lines'));
};

describe('SubjectLineContent', () => {
  beforeEach(() => {
    generateAI.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows the AI subject lines and send time, with no invented open rates', async () => {
    generateAI.mockResolvedValue({
      data: { subjects: [{ text: 'Still keen on a demo?', rationale: 'Short and direct' }], bestSendTime: 'Tuesday morning' },
    });
    render(<SubjectLineContent />);
    fill();
    await waitFor(() => expect(screen.getByText(/Still keen on a demo\?/)).toBeInTheDocument());
    expect(screen.getByText(/Short and direct/)).toBeInTheDocument();
    expect(screen.getByText(/Tuesday morning/)).toBeInTheDocument();
    expect(generateAI.mock.calls[0][0].prompt).toContain('Our spring demo');
    expect(document.body.textContent).not.toMatch(/Estimated Open Rate|32\.5%|28\.7%/);
  });

  it('omits the send time when the model returns none', async () => {
    generateAI.mockResolvedValue({ data: { subjects: [{ text: 'Hello', rationale: 'r' }], bestSendTime: null } });
    render(<SubjectLineContent />);
    fill();
    await waitFor(() => expect(screen.getByText(/"Hello"/)).toBeInTheDocument());
    expect(document.body.textContent).not.toMatch(/Send Time/);
  });

  it('shows the server message on failure', async () => {
    generateAI.mockImplementation(async () => {
      throw new Error('Add your OpenAI API key in Settings → API Keys');
    });
    render(<SubjectLineContent />);
    fill();
    await waitFor(() =>
      expect(screen.getByText('Add your OpenAI API key in Settings → API Keys')).toBeInTheDocument()
    );
    expect(document.body.textContent).not.toMatch(/Estimated Open Rate/);
  });
});
