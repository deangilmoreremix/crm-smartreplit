import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useDealStore } from '../../store/dealStore';
import { dealPeriodChanges, formatChange } from '../../utils/periodTrend';

const MetricsCards: React.FC = () => {
  const { isDark } = useTheme();
  const { navigateToFeature } = useNavigation();
  const { deals } = useDealStore();

  const dealsArray = Object.values(deals);
  const openDeals = dealsArray.filter(
    (d) => String(d.stage) !== 'closed-won' && String(d.stage) !== 'closed-lost'
  );
  const wonCount = dealsArray.filter((d) => String(d.stage) === 'closed-won').length;
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const avgDealSize = openDeals.length > 0 ? pipelineValue / openDeals.length : 0;
  // Last 30 days vs the previous 30, from real timestamps; null hides the badge
  const changes = dealPeriodChanges(dealsArray);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const kpis = [
    {
      title: 'Active Deals',
      value: openDeals.length.toString(),
      change: formatChange(changes.newDeals),
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      feature: 'pipeline-section',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      change: formatChange(changes.newPipelineValue),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      feature: 'pipeline-section',
    },
    {
      title: 'Won Deals',
      value: wonCount.toString(),
      change: formatChange(changes.wonDeals),
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      feature: 'analytics-section',
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(avgDealSize),
      change: formatChange(changes.avgNewDealSize),
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      feature: 'analytics-section',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          onClick={() => navigateToFeature(kpi.feature)}
          className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-sm hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all duration-300 group`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${kpi.color} shadow-lg`}>
              <kpi.icon className="h-6 w-6 text-white" />
            </div>
            {kpi.change && (
              <div
                title="Last 30 days vs the previous 30 days, by deal created / closed date"
                className={`flex items-center ${kpi.change.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}
              >
                {kpi.change.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">{kpi.change.text}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3
              className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
            >
              {kpi.value}
            </h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{kpi.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
