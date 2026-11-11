import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const refetch = vi.fn();
let sales: Record<string, unknown> = {};
vi.mock('../../../hooks/useSalesData', () => ({ useSalesData: () => ({ ...sales, refetch }) }));
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../LayoutWidgetSettings', () => ({
  useWidgetSettings: () => ({ rangeDays: 30, metric: 'performance', setSettings: vi.fn() }),
}));
let demo = false;
vi.mock('../../../contexts/DemoDataContext', () => ({ useDemoDataSafe: () => ({ showDemoData: demo }) }));
vi.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  return {
    ResponsiveContainer: Passthrough,
    LineChart: Passthrough,
    BarChart: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Line: Nothing,
    Bar: Nothing,
    XAxis: Nothing,
    YAxis: Nothing,
    CartesianGrid: Nothing,
    Tooltip: Nothing,
    Legend: Nothing,
    Cell: Nothing,
  };
});

import ChartsSection from '../ChartsSection';

describe('ChartsSection', () => {
  beforeEach(() => {
    refetch.mockReset();
    demo = false;
  });

  it('offers a Retry button on error', () => {
    sales = { deals: [], contacts: [], loading: false, error: 'Request failed (500)' };
    render(<ChartsSection />);
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed (500)');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows no KPI values without data, and sample KPI values when demo is enabled', () => {
    sales = { deals: [], contacts: [], loading: false, error: null };
    const a = render(<ChartsSection />);
    expect(screen.getByText('Avg Deal Size').parentElement).toHaveTextContent('—');
    a.unmount();

    demo = true;
    render(<ChartsSection />);
    expect(screen.getByText('Avg Deal Size').parentElement).not.toHaveTextContent('—');
    expect(screen.getByText('Includes sample data')).toBeInTheDocument();
  });
});
