import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const hookState: any = { apiConfig: null, isLoading: false, error: null };
vi.mock('../../../hooks/useAIApiKeys', () => ({ useAIApiKeys: () => hookState }));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../contexts/AIConfigurationContext', () => ({
  useAIConfiguration: () => ({ openAIProviderModal: vi.fn(), showAIProviderModal: false }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import AIConfigurationStatusWidget from '../AIConfigurationStatusWidget';

const cfg = (openai = '', openclaw = '') => ({
  openai: { apiKey: openai, model: 'gpt-4.1' },
  gemini: { apiKey: '', model: 'x' },
  openclaw: { apiKey: openclaw, model: 'default' },
});

describe('AIConfigurationStatusWidget', () => {
  beforeEach(() => {
    hookState.error = null;
    hookState.isLoading = false;
    localStorage.setItem('smartcrm_api_keys', JSON.stringify([{ providerId: 'anthropic' }]));
  });

  it('ignores localStorage and shows not-configured when the server has no key', () => {
    hookState.apiConfig = cfg();
    render(<AIConfigurationStatusWidget />);
    expect(screen.getByText('Configure AI Keys')).toBeTruthy();
    expect(screen.queryByText('Anthropic')).toBeNull();
  });

  it('shows configured providers from server status without exposing the key', () => {
    hookState.apiConfig = cfg('sk-secret-123', '');
    const { container } = render(<AIConfigurationStatusWidget />);
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText(/1 AI provider configured/)).toBeTruthy();
    expect(container.textContent).not.toContain('sk-secret-123');
  });

  it('surfaces the real load error', () => {
    hookState.apiConfig = cfg();
    hookState.error = 'permission denied for table user_api_keys';
    render(<AIConfigurationStatusWidget />);
    expect(screen.getByText('permission denied for table user_api_keys')).toBeTruthy();
  });
});
