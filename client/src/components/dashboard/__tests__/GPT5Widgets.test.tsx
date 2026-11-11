import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AIServiceError } from '../../../services/gpt5Service';

const h = vi.hoisted(() => ({
  deals: [] as any[],
  contacts: {} as Record<string, any>,
  kpi: vi.fn(),
  bi: vi.fn(),
  intel: vi.fn(),
  greeting: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: h.deals }) }));
vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({ contacts: h.contacts }),
}));
vi.mock('../../../store/taskStore', () => ({ useTaskStore: () => ({ tasks: {} }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../contexts/DemoDataContext', () => ({
  useDemoData: () => ({ showDemoData: false }),
}));
vi.mock('../../ClearDemoDataModal', () => ({ default: () => null }));
vi.mock('../../../services/gpt5Service', async (orig) => {
  const actual = await orig<typeof import('../../../services/gpt5Service')>();
  return {
    ...actual,
    gpt5Service: {
      analyzeKPITrends: h.kpi,
      generateBusinessIntelligence: h.bi,
      analyzeDealIntelligence: h.intel,
      generateSmartGreeting: h.greeting,
    },
  };
});

import GPT5SmartKPICards from '../GPT5SmartKPICards';
import GPT5AnalyticsPanel from '../GPT5AnalyticsPanel';
import GPT5DealIntelligence from '../GPT5DealIntelligence';
import DashboardHeader from '../DashboardHeader';
import GPT5EnhancedDashboard from '../GPT5EnhancedDashboard';

const stage = (id: string) => ({ id, name: id, order: 1, color: '', probability: 0, isActive: true });
const deal = (id: string, stageId: string, value: number, extra: any = {}) => ({
  id,
  title: `Deal ${id}`,
  value,
  stage: stage(stageId),
  probability: 30,
  contactId: 'missing-contact',
  ...extra,
});

const noKey = () => new AIServiceError('needs_api_key', 200, 'no key');
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  h.deals = [];
  h.contacts = {};
  h.kpi.mockReset();
  h.bi.mockReset();
  h.intel.mockReset();
  h.greeting.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('GPT5SmartKPICards', () => {
  it('shows an empty state instead of a skeleton when there are no deals', () => {
    render(<GPT5SmartKPICards />);
    expect(screen.getByTestId('kpi-empty')).toBeInTheDocument();
    expect(h.kpi).not.toHaveBeenCalled();
  });

  it('counts stages via stage.id, shows real values and no invented change/confidence', async () => {
    h.deals = [deal('1', 'closed-won', 1000), deal('2', 'proposal', 3000), deal('3', 'closed-lost', 500)];
    h.kpi.mockResolvedValue({ summary: 'Real AI summary', recommendations: ['Do X'] });
    const { container } = render(<GPT5SmartKPICards />);
    await advance(900);
    expect(screen.getAllByText('$4,500').length).toBeGreaterThan(0); // pipeline
    expect(screen.getByText('33.3%')).toBeInTheDocument(); // 1 won / 3
    expect(screen.getByText('$3,000')).toBeInTheDocument(); // avg of the single active deal
    expect(screen.getByText('Real AI summary')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/15\.2|8\.7|12\.4|5\.3|92%|Projected/);
    // no history is invented
    expect(h.kpi.mock.calls[0][0]).toEqual({});
  });

  it('shows a no-key state and no AI insight when the service throws', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.kpi.mockRejectedValue(noKey());
    render(<GPT5SmartKPICards />);
    await advance(900);
    expect(screen.getByTestId('ai-needs-api-key')).toBeInTheDocument();
    expect(screen.queryByTestId('kpi-ai-insight')).not.toBeInTheDocument();
    expect(screen.getAllByText('$1,000').length).toBeGreaterThan(0);
  });

  it('does not refire when store references change without the numbers changing', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.kpi.mockResolvedValue({ summary: 's' });
    const { rerender } = render(<GPT5SmartKPICards />);
    await advance(900);
    h.deals = [deal('1', 'proposal', 1000)];
    rerender(<GPT5SmartKPICards />);
    await advance(900);
    expect(h.kpi).toHaveBeenCalledTimes(1);
  });
});

describe('GPT5AnalyticsPanel', () => {
  it('shows only AI-returned insights and no templated cards or hard-coded benchmarks', async () => {
    h.deals = [deal('1', 'closed-won', 1000), deal('2', 'negotiation', 3000)];
    h.kpi.mockResolvedValue({ summary: 'AI says hi', recommendations: ['Rec A'] });
    h.bi.mockResolvedValue({ growth_opportunities: ['Grow'], strategic_recommendations: [] });
    const { container } = render(<GPT5AnalyticsPanel />);
    await advance(2100);
    expect(screen.getAllByTestId('analytics-insight')).toHaveLength(1);
    expect(screen.getByText('AI says hi')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // real win rate via stage.id
    expect(container.textContent).not.toMatch(/confidence|Revenue Forecasting|Segmentation/);
    const sent = JSON.stringify(h.kpi.mock.calls[0]);
    expect(sent).not.toMatch(/50000|benchmarks/);
    expect(h.kpi.mock.calls[0][1].current.wonDeals).toBe(1);
    expect(h.kpi.mock.calls[0][1].current.activeDeals).toBe(1);
  });

  it('renders a no-key state and zero insight cards when AI is unavailable', async () => {
    h.deals = [deal('1', 'negotiation', 3000)];
    h.kpi.mockRejectedValue(noKey());
    h.bi.mockRejectedValue(noKey());
    render(<GPT5AnalyticsPanel />);
    await advance(2100);
    expect(screen.getByTestId('ai-needs-api-key')).toBeInTheDocument();
    expect(screen.queryAllByTestId('analytics-insight')).toHaveLength(0);
  });

  it('does not refire when only store references change', async () => {
    h.deals = [deal('1', 'negotiation', 3000)];
    h.kpi.mockResolvedValue({ summary: 's' });
    h.bi.mockResolvedValue({});
    const { rerender } = render(<GPT5AnalyticsPanel />);
    await advance(2100);
    h.deals = [deal('1', 'negotiation', 3000)];
    rerender(<GPT5AnalyticsPanel />);
    await advance(2100);
    expect(h.kpi).toHaveBeenCalledTimes(1);
  });
});

describe('GPT5DealIntelligence', () => {
  it('analyzes active deals even without a contact and excludes closed-won/lost via stage.id', async () => {
    h.deals = [
      deal('1', 'proposal', 1000),
      deal('2', 'closed-won', 2000),
      deal('3', 'closed-lost', 3000),
    ];
    h.intel.mockResolvedValue({
      probability_score: 70,
      risk_level: 'low',
      key_factors: ['f'],
      recommendations: ['r'],
      estimated_close_days: 10,
      confidence_level: 'high',
    });
    render(<GPT5DealIntelligence />);
    await advance(3100);
    expect(h.intel).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('deal-intel-card')).toHaveLength(1);
    expect(screen.queryByTestId('estimate-badge')).not.toBeInTheDocument();
  });

  it('marks cards as Estimate when AI response lacks fields and invents no factors', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.intel.mockResolvedValue({ probability_score: 55 });
    const { container } = render(<GPT5DealIntelligence />);
    await advance(3100);
    expect(screen.getByTestId('estimate-badge')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Stage progression|Contact engagement|30 days/);
  });

  it('shows per-card and top-level no-key state on failure', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.intel.mockRejectedValue(noKey());
    render(<GPT5DealIntelligence />);
    await advance(3100);
    expect(screen.getAllByTestId('ai-needs-api-key').length).toBeGreaterThan(0);
    expect(screen.queryByText(/% win probability/)).not.toBeInTheDocument();
  });
});

describe('DashboardHeader', () => {
  it('falls back to the static subtitle with no badge when the greeting fails', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.greeting.mockRejectedValue(noKey());
    render(<DashboardHeader subtitle="Static subtitle" />);
    await advance(50);
    expect(screen.getByText('Static subtitle')).toBeInTheDocument();
    expect(screen.queryByText(/GPT-5 Enhanced/)).not.toBeInTheDocument();
  });

  it('shows the badge only with a real AI greeting and the real contact count (no 34 fallback)', async () => {
    h.deals = [deal('1', 'proposal', 1000)];
    h.greeting.mockResolvedValue({ greeting: 'Hello from AI' });
    render(<DashboardHeader />);
    await advance(50);
    expect(screen.getByText('Hello from AI')).toBeInTheDocument();
    expect(screen.getByText(/GPT-5 Enhanced/)).toBeInTheDocument();
    expect(screen.getByText('Total Contacts').nextElementSibling?.textContent).toBe('0');
    expect(screen.queryByText('AI Win Probability')).not.toBeInTheDocument();
  });
});

describe('GPT5EnhancedDashboard', () => {
  it('renders only the status strip, none of the child sections', () => {
    h.deals = [deal('1', 'proposal', 1000)];
    const { container } = render(<GPT5EnhancedDashboard />);
    expect(screen.getByTestId('gpt5-status-strip')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/AIME|Investment|ROI/);
    expect(screen.queryByText('Total Contacts')).not.toBeInTheDocument();
    expect(screen.queryByText('Smart KPI Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('Deal Intelligence')).not.toBeInTheDocument();
    expect(screen.queryByText('Advanced Analytics')).not.toBeInTheDocument();
    expect(h.kpi).not.toHaveBeenCalled();
  });
});
