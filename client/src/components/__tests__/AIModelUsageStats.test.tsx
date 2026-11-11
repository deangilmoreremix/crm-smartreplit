import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  showDemoData: false,
  supa: vi.fn(),
  local: vi.fn(),
}));

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../contexts/DemoDataContext', () => ({
  useDemoDataSafe: () => ({ showDemoData: h.showDemoData }),
}));
vi.mock('../../services/supabaseAIService', () => ({
  supabaseAIService: { getUsageStats: h.supa },
}));
vi.mock('../../services/aiUsageTracker', () => ({
  aiUsageTracker: { getRecordsSince: h.local },
}));

import AIModelUsageStats from '../AIModelUsageStats';

beforeEach(() => {
  h.showDemoData = false;
  h.supa.mockReset().mockResolvedValue([]);
  h.local.mockReset().mockReturnValue([]);
});

describe('AIModelUsageStats', () => {
  it('shows an empty state (no demo numbers) when there is no usage and demo data is off', async () => {
    render(<AIModelUsageStats />);
    await waitFor(() => expect(screen.getByText('No AI usage recorded yet.')).toBeInTheDocument());
    expect(screen.queryByText('$14.30')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sample-badge')).not.toBeInTheDocument();
  });

  it('shows labelled demo numbers only when demo data is on', async () => {
    h.showDemoData = true;
    render(<AIModelUsageStats />);
    await waitFor(() => expect(screen.getByTestId('sample-badge')).toBeInTheDocument());
    expect(screen.getByText('$14.30')).toBeInTheDocument();
  });

  it('prefers real Supabase usage over demo data', async () => {
    h.showDemoData = true;
    h.supa.mockResolvedValue([
      { modelId: 'm1', requests: 7, tokensUsed: 700, totalCost: 1.5, avgResponseTime: 2 },
    ]);
    render(<AIModelUsageStats />);
    await waitFor(() => expect(screen.getAllByText('$1.50').length).toBeGreaterThan(0));
    expect(screen.queryByTestId('sample-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('$14.30')).not.toBeInTheDocument();
  });

  it('falls back to local ai_usage_history records without inventing cost', async () => {
    h.local.mockReturnValue([
      { model: 'gpt-x', inputTokens: 10, outputTokens: 5, executionTime: 2000, timestamp: new Date() },
      { model: 'gpt-x', inputTokens: 20, outputTokens: 5, executionTime: 1000, timestamp: new Date() },
    ]);
    render(<AIModelUsageStats />);
    await waitFor(() => expect(screen.getByText('gpt-x')).toBeInTheDocument());
    expect(screen.getAllByText('n/a').length).toBeGreaterThan(0);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0); // total tokens
  });
});
