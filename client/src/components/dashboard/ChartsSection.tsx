import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useWidgetSettings } from './LayoutWidgetSettings';
import {
  ApiDeal,
  isWon,
  isLost,
  performanceSeries,
  pipelineByStage,
  valueByStage,
  salesKpis,
  sliceForRange,
  mergePerformance,
  mergePipeline,
  mergeBreakdown,
} from './chartData';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import { DEMO_PERFORMANCE, DEMO_PIPELINE, DEMO_BREAKDOWN } from '../../data/demoData';
import SampleBadge from '../SampleBadge';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';
import { BarChart3, LineChart, PieChart as PieChartIcon, TrendingUp, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ChartMetric = 'performance' | 'pipeline' | 'breakdown';
const CHART_METRICS: ChartMetric[] = ['performance', 'pipeline', 'breakdown'];
const TIMEFRAMES = { week: 7, month: 30, quarter: 90 } as const;

interface ApiContact {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface SalesData {
  deals: ApiDeal[];
  contacts: ApiContact[];
  loading: boolean;
  error: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Loads deals and contacts from the CRM API (no local/sample data). */
export function useSalesData(): SalesData {
  const [state, setState] = React.useState<SalesData>({ deals: [], contacts: [], loading: true, error: null });
  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getJson<ApiDeal[]>('/api/deals'), getJson<ApiContact[]>('/api/contacts').catch(() => [])])
      .then(([deals, contacts]) => {
        if (!cancelled) setState({ deals, contacts, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setState({ deals: [], contacts: [], loading: false, error: e instanceof Error ? e.message : 'Failed to load' });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

const fmtMoney = (n: number | null) => (n === null ? '—' : `$${Math.round(n).toLocaleString()}`);
const fmtPct = (n: number | null) => (n === null ? '—' : `${n.toFixed(1)}%`);
const fmtDays = (n: number | null) => (n === null ? '—' : `${Math.round(n)} days`);

/** `sectionId` selects which persisted widget settings (range / metric) this chart reads. */
const ChartsSection: React.FC<{ sectionId?: string }> = ({ sectionId = 'charts-section' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { rangeDays, metric, setSettings } = useWidgetSettings(sectionId);
  const activeTab: ChartMetric = CHART_METRICS.includes(metric as ChartMetric)
    ? (metric as ChartMetric)
    : 'performance';
  const setActiveTab = (m: ChartMetric) => setSettings({ metric: m });
  const timeframe = (Object.keys(TIMEFRAMES) as Array<keyof typeof TIMEFRAMES>).find(
    (k) => TIMEFRAMES[k] === rangeDays
  ) ?? 'month';
  const setTimeframe = (k: keyof typeof TIMEFRAMES) => setSettings({ rangeDays: TIMEFRAMES[k] });
  const { deals, contacts, loading, error } = useSalesData();
  const { showDemoData } = useDemoDataSafe();
  const now = React.useMemo(() => Date.now(), [deals, rangeDays]);

  const contactsById = React.useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const c of contacts) {
      m.set(String(c.id), { id: String(c.id), name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || `Contact ${c.id}` });
    }
    return m;
  }, [contacts]);

  const contactsFor = (pred: (d: ApiDeal) => boolean) => {
    const seen = new Set<string>();
    const out: Array<{ id: string; name: string; avatar?: string }> = [];
    for (const d of deals) {
      const c = d.contactId != null ? contactsById.get(String(d.contactId)) : undefined;
      if (c && pred(d) && !seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
    return out;
  };
  const wonDealsContacts = React.useMemo(() => contactsFor(isWon), [deals, contactsById]);
  const dealsForAvgSizeContacts = React.useMemo(() => contactsFor((d) => !isLost(d)), [deals, contactsById]);

  // Render avatar stack
  const renderAvatarStack = (
    contacts: Array<{ id: string; name: string; avatar?: string }>,
    maxVisible: number = 3
  ) => {
    const visibleContacts = contacts.slice(0, maxVisible);
    const remainingCount = Math.max(0, contacts.length - maxVisible);

    return (
      <div className="flex items-center mt-2">
        <div className="flex -space-x-2">
          {visibleContacts.map((contact, index) => (
            <div key={contact.id} className="relative" style={{ zIndex: maxVisible - index }}>
              <Avatar
                src={contact.avatar}
                alt={contact.name}
                size="sm"
                fallback={getInitials(contact.name)}
                className=""
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sample series are merged with the real aggregates only while demo data is enabled.
  const performanceData = React.useMemo(() => {
    const real = performanceSeries(deals, rangeDays, now);
    return showDemoData ? mergePerformance(real, sliceForRange(DEMO_PERFORMANCE, rangeDays)) : real;
  }, [deals, rangeDays, now, showDemoData]);
  const pipelineData = React.useMemo(() => {
    const real = pipelineByStage(deals, rangeDays, now);
    return showDemoData ? mergePipeline(real, DEMO_PIPELINE) : real;
  }, [deals, rangeDays, now, showDemoData]);
  const breakdownData = React.useMemo(() => {
    const real = valueByStage(deals, rangeDays, now);
    return showDemoData ? mergeBreakdown(real, DEMO_BREAKDOWN) : real;
  }, [deals, rangeDays, now, showDemoData]);
  const kpis = React.useMemo(() => salesKpis(deals, rangeDays, now), [deals, rangeDays, now]);

  const hasData =
    activeTab === 'performance'
      ? performanceData.some((p) => p.deals > 0)
      : activeTab === 'pipeline'
        ? pipelineData.length > 0
        : breakdownData.length > 0;

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed'];

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sales Analytics
          {showDemoData && <SampleBadge label="Includes sample data" className="ml-3 align-middle" />}
        </h2>

        <div className="flex items-center space-x-4">
          {/* Chart Type Tabs */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'performance'
                  ? isDark
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LineChart size={16} className="mr-1.5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'pipeline'
                  ? isDark
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={16} className="mr-1.5" />
              <span>Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'breakdown'
                  ? isDark
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChartIcon size={16} className="mr-1.5" />
              <span>Breakdown</span>
            </button>
          </div>

          {/* Time Frame Selector */}
          <div className="flex">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as keyof typeof TIMEFRAMES)}
                className={`px-3 py-1.5 text-sm ${
                  timeframe === period
                    ? isDark
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-80">
        {(loading || error || !hasData) && (
          <div
            role={error ? 'alert' : 'status'}
            className={`h-full flex items-center justify-center text-sm ${
              error ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {loading
              ? 'Loading sales data…'
              : error
                ? `Could not load sales data: ${error}`
                : 'No deal data for this period yet.'}
          </div>
        )}
        {!loading && !error && hasData && activeTab === 'performance' && (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={performanceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0'}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
                tickFormatter={(value) => `$${Math.round(value / 100) / 10}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: isDark ? '#F3F4F6' : '#374151' }}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Deals Closed',
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: '#3B82F6',
                  strokeWidth: 2,
                  fill: isDark ? '#1F2937' : '#ffffff',
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="deals"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: '#8B5CF6',
                  strokeWidth: 2,
                  fill: isDark ? '#1F2937' : '#ffffff',
                }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )}

        {!loading && !error && hasData && activeTab === 'pipeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0'}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [`${value} deals`, 'Count']}
              />
              <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!loading && !error && hasData && activeTab === 'breakdown' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Value']}
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp
              className={`w-4 h-4 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}
            />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Conversion Rate
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fmtPct(kpis.conversionRate)}
              </div>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Avg Deal Size
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fmtMoney(kpis.avgDealSize)}
              </div>
            </div>
          </div>
          {/* Add avatar stack for deals */}
          {dealsForAvgSizeContacts.length > 0 && renderAvatarStack(dealsForAvgSizeContacts)}
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp
              className={`w-4 h-4 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
            />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sales Cycle
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fmtDays(kpis.salesCycleDays)}
              </div>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp
              className={`w-4 h-4 mr-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}
            />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Win Rate
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fmtPct(kpis.winRate)}
              </div>
            </div>
          </div>
          {/* Add avatar stack for won deals */}
          {wonDealsContacts.length > 0 && renderAvatarStack(wonDealsContacts)}
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
