import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DollarSign, Target, Award, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDealStore } from '../../store/dealStore';
import { computeDealTotals, createdPeriodChange, formatChange } from './dealMetrics';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** Same figures as KPICards (both read the deal store), so the two never disagree. */
const MetricsCards: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { deals } = useDealStore();

  const totals = computeDealTotals(deals);
  const changes = React.useMemo(() => {
    const now = Date.now();
    return {
      active: createdPeriodChange(deals, (c) => computeDealTotals(c).activeCount, now),
      value: createdPeriodChange(deals, (c) => computeDealTotals(c).activeValue, now),
      won: createdPeriodChange(deals, (c) => computeDealTotals(c).wonCount, now),
      avg: createdPeriodChange(deals, (c) => computeDealTotals(c).avgActiveDealSize, now),
    };
  }, [deals]);

  const kpis = [
    {
      title: 'Active Deals',
      value: String(totals.activeCount),
      change: changes.active,
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      to: '/pipeline',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(totals.activeValue),
      change: changes.value,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      to: '/pipeline',
    },
    {
      title: 'Won Deals',
      value: String(totals.wonCount),
      change: changes.won,
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      to: '/analytics',
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(totals.avgActiveDealSize),
      change: changes.avg,
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      to: '/analytics',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi) => {
        const label = formatChange(kpi.change);
        const up = (kpi.change ?? 0) >= 0;
        return (
          <div
            key={kpi.title}
            role="button"
            tabIndex={0}
            onClick={() => navigate(kpi.to)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(kpi.to);
              }
            }}
            className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 shadow-sm hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all duration-300 group cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${kpi.color} shadow-lg`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              {label !== null && (
                <div className={`flex items-center ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {up ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium" data-testid="metric-change">
                    {label}
                  </span>
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
        );
      })}
    </div>
  );
};

export default MetricsCards;
