import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const hook = { apiConfig: { openai: { apiKey: '', model: 'm' }, openclaw: { apiKey: '', model: 'default' } }, isLoading: false, error: null as string | null };
vi.mock('../../hooks/useAIApiKeys', () => ({ useAIApiKeys: () => hook }));
vi.mock('../aiIntegration/AIApiKeySettings', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>key dialog</div> : null),
}));

import AIProviderSettings from '../AIProviderSettings';

describe('AIProviderSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    hook.apiConfig.openai.apiKey = '';
    hook.error = null;
  });

  it('shows whether a server-held key exists, never the key', () => {
    hook.apiConfig.openai.apiKey = 'sk-****abcd';
    render(<AIProviderSettings />);
    expect(screen.getByTestId('provider-openai')).toHaveTextContent('Key saved');
    expect(screen.getByTestId('provider-openclaw')).toHaveTextContent('No key');
    expect(document.body).not.toHaveTextContent('sk-');
  });

  it('opens the server-backed key dialog and writes nothing to the browser', async () => {
    render(<AIProviderSettings />);
    await userEvent.click(screen.getByRole('button', { name: /manage api keys/i }));
    expect(screen.getByText('key dialog')).toBeInTheDocument();
    expect(localStorage.getItem('smartcrm_api_keys')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('shows the real load error', () => {
    hook.error = 'Failed to load API keys (401)';
    render(<AIProviderSettings />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load API keys (401)');
  });
});
