import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const post = vi.fn();
vi.mock('../../../services/unifiedApiClient', () => ({ api: { post: (...a: any[]) => post(...a) } }));
vi.mock('../../../hooks/useContactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: {} }) }));
vi.mock('@/components/ui/GlassCard', () => ({ GlassCard: ({ children }: any) => <div>{children}</div> }));

import { OpenClawChatWidget } from '../OpenClawChatWidget';

describe('OpenClawChatWidget', () => {
  beforeEach(() => {
    post.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('sends through the server proxy without any browser-held key', async () => {
    post.mockResolvedValue({ success: true, data: { response: 'Hi there' } });
    render(<OpenClawChatWidget />);
    await userEvent.type(screen.getByRole('textbox'), 'hello{enter}');
    await screen.findByText('Hi there');
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/api/openclaw/chat');
    expect(body.message).toBe('hello');
    expect(JSON.stringify(post.mock.calls[0])).not.toMatch(/Bearer|apiKey/i);
  });

  it('shows the real error message on failure', async () => {
    post.mockResolvedValue({ success: false, error: 'HTTP 502: bad gateway' });
    render(<OpenClawChatWidget />);
    await userEvent.type(screen.getByRole('textbox'), 'hello{enter}');
    await waitFor(() => expect(screen.getByText(/HTTP 502: bad gateway/)).toBeTruthy());
  });
});
