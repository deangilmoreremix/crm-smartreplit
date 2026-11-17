import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

import AdminAnalytics from '../AdminAnalytics';

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows the real total user count from /api/admin/stats', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({ totalUsers: 7 }) });
    render(<AdminAnalytics />);
    await waitFor(() => expect(screen.getByTestId('metric-total-users')).toHaveTextContent('7'));
    expect(fetch).toHaveBeenCalledWith('/api/admin/stats', expect.anything());
  });

  it('shows metrics without a source as unavailable and none of the old fake literals', async () => {
    (fetch as any).mockResolvedValue({ ok: false, json: async () => ({}) });
    const { container } = render(<AdminAnalytics />);
    expect(screen.getByTestId('metric-active-sessions')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('metric-api-calls-today')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('metric-avg-response-time')).toHaveTextContent('Unavailable');
    expect(screen.getByText('Usage analytics are not available yet')).toBeInTheDocument();
    for (const fake of ['247', '89', '15,234', '124ms', '+12%', '+5%', '+8%', '-3%']) {
      expect(container.textContent).not.toContain(fake);
    }
  });
});
