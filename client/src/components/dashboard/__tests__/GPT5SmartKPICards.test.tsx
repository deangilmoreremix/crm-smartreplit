import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/contactStore', () => ({ useContactStore: () => ({ contacts: {} }) }));
const analyzeKPITrends = vi.fn();
vi.mock('../../../services/gpt5Service', () => ({ gpt5Service: { analyzeKPITrends: (...a: any[]) => analyzeKPITrends(...a) } }));

import GPT5SmartKPICards from '../GPT5SmartKPICards';
import { useDealStore } from '../../../store/dealStore';

const day = 86_400_000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();
// Rows as the server returns them (shared/schema.ts deals): stage is the stage id as text
const rows = [
  { id: 1, title: 'Acme renewal', value: '12000', stage: 'proposal', probability: 40, createdAt: iso(8), updatedAt: iso(3) },
  { id: 2, title: 'Globex expansion', value: '30000', stage: 'closed-won', probability: 100, createdAt: iso(50), updatedAt: iso(20), actualCloseDate: iso(20) },
];

describe('GPT5SmartKPICards', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    analyzeKPITrends.mockReset().mockRejectedValue(new Error('Add your OpenAI API key in Settings → API Keys.'));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => rows })));
    useDealStore.setState({ deals: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('computes win rate, active deals and sizes from the deals the server returned', async () => {
    await act(async () => {
      await useDealStore.getState().fetchDeals();
    });
    render(<GPT5SmartKPICards />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => expect(screen.getByText('Win Rate')).toBeInTheDocument());
    // the metric card is the nearest ancestor that also holds the value text
    const card = (title: string) => {
      let el: HTMLElement | null = screen.getByText(title);
      while (el && !/\d/.test(el.textContent || '')) el = el.parentElement;
      return el as HTMLElement;
    };
    expect(card('Win Rate')).toHaveTextContent('50.0%'); // 1 won of 2 deals
    // pipeline = open deals only: the closed-won $30,000 deal is not pipeline
    expect(card('Pipeline Value')).toHaveTextContent('$12,000');
    expect(card('Avg Deal Size')).toHaveTextContent('$12,000');
    expect(card('Active Deals')).toHaveTextContent('1');
    expect(document.body).not.toHaveTextContent('$42,000');
  });
});
