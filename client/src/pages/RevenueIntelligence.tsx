import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { generateAI } from '../services/aiGenerate';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import Avatar from '../components/ui/Avatar';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Calendar,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Trophy,
} from 'lucide-react';

const RevenueIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  // Calculate revenue metrics
  const dealsArray = Object.values(deals);
  const wonDeals = dealsArray.filter((d) => String(d.stage) === 'closed-won');
  const activeDeals = dealsArray.filter(
    (d) => !['closed-won', 'closed-lost'].includes(String(d.stage))
  );

  const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const projectedRevenue = activeDeals.reduce(
    (sum, deal) => sum + deal.value * (deal.probability / 100),
    0
  );
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  // Date a won deal closed (falls back to its last update)
  const closeDate = (d: any) => new Date(d.actualCloseDate || d.closedAt || d.updatedAt || d.createdAt);
  const DAY = 86400000;
  const now = Date.now();
  const wonBetween = (fromDaysAgo: number, toDaysAgo: number) =>
    wonDeals
      .filter((d) => {
        const age = (now - closeDate(d).getTime()) / DAY;
        return age < fromDaysAgo && age >= toDaysAgo;
      })
      .reduce((sum, d) => sum + d.value, 0);

  // Year-over-year growth of won revenue (null when there is no prior-year revenue to compare)
  const lastYearRevenue = wonBetween(365, 0);
  const priorYearRevenue = wonBetween(730, 365);
  const revenueGrowth =
    priorYearRevenue > 0 ? ((lastYearRevenue - priorYearRevenue) / priorYearRevenue) * 100 : null;
  const growthLabel =
    revenueGrowth === null ? '—' : `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`;

  // Current and previous calendar quarter
  const today = new Date();
  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  const prevQuarterStart = new Date(quarterStart.getFullYear(), quarterStart.getMonth() - 3, 1);
  const quarterRevenue = wonDeals.filter((d) => closeDate(d) >= quarterStart).reduce((s, d) => s + d.value, 0);
  const prevQuarterRevenue = wonDeals
    .filter((d) => closeDate(d) >= prevQuarterStart && closeDate(d) < quarterStart)
    .reduce((s, d) => s + d.value, 0);
  const quarterChange =
    prevQuarterRevenue > 0
      ? `${quarterRevenue >= prevQuarterRevenue ? '+' : ''}${(((quarterRevenue - prevQuarterRevenue) / prevQuarterRevenue) * 100).toFixed(0)}% vs last quarter`
      : 'No won revenue last quarter';
  const last30Revenue = wonBetween(30, 0);

  // Current metrics computed from CRM records
  const contactCount = Object.keys(contacts).length;
  const conversionRate = dealsArray.length > 0 ? (wonDeals.length / dealsArray.length) * 100 : 0;
  const cycleDays = wonDeals.map((d) => (closeDate(d).getTime() - new Date(d.createdAt).getTime()) / DAY);
  const avgCycleDays = cycleDays.length > 0 ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : null;
  const currentMetrics = [
    { metric: 'Revenue per Contact', value: contactCount > 0 ? formatMoney(totalRevenue / contactCount) : '—' },
    { metric: 'Average Won Deal Size', value: wonDeals.length > 0 ? formatMoney(avgDealSize) : '—' },
    { metric: 'Deal Conversion Rate', value: dealsArray.length > 0 ? `${conversionRate.toFixed(1)}%` : '—' },
    { metric: 'Average Sales Cycle', value: avgCycleDays !== null ? `${Math.round(avgCycleDays)} days` : '—' },
  ];

  // Forecast: probability-weighted value of open deals by expected close quarter
  const quarterKey = (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
  const forecastBuckets = new Map<string, { forecast: number; probabilities: number[]; order: number }>();
  activeDeals.forEach((d) => {
    const expected = d.expectedCloseDate ? new Date(d.expectedCloseDate) : null;
    const key = expected ? quarterKey(expected) : 'No close date';
    const order = expected
      ? expected.getFullYear() * 4 + Math.floor(expected.getMonth() / 3)
      : Number.MAX_SAFE_INTEGER;
    const bucket = forecastBuckets.get(key) || { forecast: 0, probabilities: [], order };
    bucket.forecast += d.value * (d.probability / 100);
    bucket.probabilities.push(d.probability);
    forecastBuckets.set(key, bucket);
  });
  const forecastPeriods = [...forecastBuckets.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .slice(0, 4)
    .map(([period, b]) => ({
      period,
      forecast: b.forecast,
      confidence: `${Math.round(b.probabilities.reduce((x, y) => x + y, 0) / b.probabilities.length)}% avg probability`,
      deals: b.probabilities.length,
    }));

  // AI insights on demand (user's OpenAI key)
  const [insights, setInsights] = useState<Array<{ insight: string; type: string; value: string }>>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const result = await generateAI({
        prompt: `Give 4 concise revenue insights for this CRM pipeline. Only use the numbers provided.\n${JSON.stringify({
          totalWonRevenue: totalRevenue,
          wonDeals: wonDeals.length,
          openDeals: activeDeals.length,
          weightedPipeline: Math.round(projectedRevenue),
          averageWonDealSize: Math.round(avgDealSize),
          conversionRatePercent: Number(conversionRate.toFixed(1)),
          averageSalesCycleDays: avgCycleDays !== null ? Math.round(avgCycleDays) : null,
          revenueThisQuarter: quarterRevenue,
          revenueLastQuarter: prevQuarterRevenue,
        })}`,
        schemaName: 'revenue_insights',
        schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  insight: { type: 'string' },
                  type: { type: 'string', enum: ['positive', 'opportunity', 'improvement'] },
                  value: { type: 'string' },
                },
                required: ['insight', 'type', 'value'],
                additionalProperties: false,
              },
            },
          },
          required: ['insights'],
          additionalProperties: false,
        },
      });
      setInsights(result.data?.insights || []);
    } catch (error) {
      setInsightsError(error instanceof Error ? error.message : 'AI insights are unavailable');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Get top revenue contributors
  const topContacts = Object.values(contacts).slice(0, 6);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get contact info from contactId
  const getContactInfo = (contactId: number | string | null) => {
    if (!contactId) return { name: 'Unknown Contact', initials: 'UC' };
    const contact = contacts[contactId];
    if (!contact) return { name: 'Unknown Contact', initials: 'UC' };
    return {
      name: contact.name,
      initials: contact.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase(),
    };
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <main
      className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl mx-auto bg-white dark:bg-gray-900"
      style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}
    >
      <div className="space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader
          title="Revenue Intelligence"
          subtitle="Advanced revenue analytics and predictive insights for growth optimization"
        />

        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{growthLabel} YoY</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(totalRevenue)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Total Revenue
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <Brain className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Weighted</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(projectedRevenue)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Projected Revenue
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{wonDeals.length} won</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(avgDealSize)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Avg Deal Size
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <Trophy className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Last 30 days</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(last30Revenue)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Won Revenue (30 days)
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Revenue Trend Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
            >
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Revenue Trend Analysis
            </h2>
            <ModernButton variant="glass" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Won Deals
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  This Quarter
                </h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(quarterRevenue)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{quarterChange}</p>
            </div>

            <div
              className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Last Quarter
                </h3>
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(prevQuarterRevenue)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Won revenue
              </p>
            </div>

            <div
              className={`p-6 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Growth Rate
                </h3>
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {growthLabel}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {revenueGrowth === null ? 'Needs a year of won deals to compare' : 'Year over year (won revenue)'}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Top Revenue Contributors */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
            >
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Top Revenue Contributors
            </h2>
            <ModernButton variant="outline" size="sm">
              View All Contributors
            </ModernButton>
          </div>

          <div className="space-y-4">
            {wonDeals.slice(0, 6).map((deal) => (
              <div
                key={deal.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar size="sm" fallback={getContactInfo(deal.contactId).initials} />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deal.title}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getContactInfo(deal.contactId).name} • Closed{' '}
                      {Math.max(0, Math.floor((now - closeDate(deal).getTime()) / DAY))} days ago
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Revenue contributor
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Revenue Intelligence Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
              >
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                AI Revenue Insights
              </h2>
            </div>

            <div className="space-y-4">
              {insights.length === 0 && (
                <div className="space-y-3">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {insightsError || 'Generate AI insights from your current revenue numbers.'}
                  </p>
                  <ModernButton variant="outline" size="sm" onClick={generateInsights} disabled={insightsLoading}>
                    <Brain className="h-4 w-4 mr-2" />
                    {insightsLoading ? 'Analyzing…' : 'Generate insights'}
                  </ModernButton>
                </div>
              )}
              {insights.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    isDark
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.insight}
                    </p>
                    <span
                      className={`text-sm font-semibold ${
                        item.type === 'positive'
                          ? 'text-green-500'
                          : item.type === 'opportunity'
                            ? 'text-blue-500'
                            : 'text-purple-500'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : item.type === 'opportunity'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.type === 'positive'
                      ? '✅ Success'
                      : item.type === 'opportunity'
                        ? '🎯 Opportunity'
                        : '📈 Improvement'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
              >
                <Target className="h-5 w-5 mr-2 text-orange-500" />
                Revenue Optimization
              </h2>
            </div>

            <div className="space-y-4">
              {currentMetrics.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.metric}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Revenue Forecast */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}
            >
              <PieChart className="h-5 w-5 mr-2 text-blue-500" />
              Revenue Forecast & Planning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {forecastPeriods.length === 0 && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No open deals to forecast.</p>
            )}
            {forecastPeriods.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg text-center ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(item.forecast)}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  {item.period}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-500">{item.confidence}</span>
                  <span className="text-green-500">{item.deals} deals</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  );
};

export default RevenueIntelligence;
