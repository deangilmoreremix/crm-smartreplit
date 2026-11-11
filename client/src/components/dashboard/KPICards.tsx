import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DollarSign, Target, Award, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';
import {
  computeDealTotals,
  createdPeriodChange,
  formatChange,
  isActiveDeal,
  isWonDeal,
} from './dealMetrics';

const KPICards: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Deals with a known contact, for the avatar stacks.
  const withContacts = (list: typeof deals) =>
    list.map((deal) => ({ ...deal, contact: contacts[deal.contactId] })).filter((deal) => deal.contact);

  const activeDealsWithContacts = withContacts(deals.filter(isActiveDeal));
  const wonDealsWithContacts = withContacts(deals.filter(isWonDeal));

  const totals = computeDealTotals(deals);
  const metrics = {
    totalActiveDeals: totals.activeCount,
    totalValue: totals.activeValue,
    avgDealSize: totals.avgActiveDealSize,
    wonDeals: totals.wonCount,
  };

  // Period-over-period (deals created in the last 30 days vs the 30 before); null hides the badge.
  const changes = React.useMemo(() => {
    const now = Date.now();
    return {
      active: createdPeriodChange(deals, (c) => computeDealTotals(c).activeCount, now),
      value: createdPeriodChange(deals, (c) => computeDealTotals(c).activeValue, now),
      won: createdPeriodChange(deals, (c) => computeDealTotals(c).wonCount, now),
      avg: createdPeriodChange(deals, (c) => computeDealTotals(c).avgActiveDealSize, now),
    };
  }, [deals]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Render avatar stack component
  const renderAvatarStack = (deals: any[], maxAvatars: number = 3) => {
    const displayDeals = deals.slice(0, maxAvatars);
    const extraCount = Math.max(0, deals.length - maxAvatars);

    return (
      <div className="flex items-center space-x-1">
        <div className="flex -space-x-2">
          {displayDeals.map((deal, index) => (
            <div key={deal.id} className="relative" style={{ zIndex: maxAvatars - index }}>
              <Avatar
                src={deal.contact.avatarSrc || deal.contact.avatar}
                alt={deal.contact.name}
                size="sm"
                fallback={getInitials(deal.contact.name)}
                className="shadow-sm"
              />
            </div>
          ))}
          {extraCount > 0 && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              +{extraCount}
            </div>
          )}
        </div>
        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {deals.length}
        </span>
      </div>
    );
  };

  const kpis = [
    {
      title: 'Active Deals',
      value: metrics.totalActiveDeals.toString(),
      change: formatChange(changes.active),
      trend: (changes.active ?? 0) >= 0 ? 'up' : 'down',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      feature: '/pipeline',
      renderContent: () =>
        activeDealsWithContacts.length > 0 ? (
          renderAvatarStack(activeDealsWithContacts)
        ) : (
          <h3
            className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
          >
            {metrics.totalActiveDeals}
          </h3>
        ),
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(metrics.totalValue),
      change: formatChange(changes.value),
      trend: (changes.value ?? 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      feature: '/pipeline',
      renderContent: () => (
        <h3
          className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
        >
          {formatCurrency(metrics.totalValue)}
        </h3>
      ),
    },
    {
      title: 'Won Deals',
      value: metrics.wonDeals.toString(),
      change: formatChange(changes.won),
      trend: (changes.won ?? 0) >= 0 ? 'up' : 'down',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      feature: '/pipeline',
      renderContent: () =>
        wonDealsWithContacts.length > 0 ? (
          renderAvatarStack(wonDealsWithContacts)
        ) : (
          <h3
            className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
          >
            {metrics.wonDeals}
          </h3>
        ),
    },
    {
      title: 'Avg Deal Size',
      value: formatCurrency(metrics.avgDealSize),
      change: formatChange(changes.avg),
      trend: (changes.avg ?? 0) >= 0 ? 'up' : 'down',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      feature: '/analytics',
      renderContent: () => (
        <h3
          className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
        >
          {formatCurrency(metrics.avgDealSize)}
        </h3>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          role="button"
          tabIndex={0}
          onClick={() => navigate(kpi.feature)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(kpi.feature);
            }
          }}
          className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all duration-300 group`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${kpi.color} shadow-lg`}>
              <kpi.icon className="h-6 w-6 text-white" />
            </div>
            {kpi.change !== null && (
              <div
                className={`flex items-center ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}
              >
                {kpi.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium" data-testid="kpi-change">
                  {kpi.change}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {kpi.renderContent && <div>{kpi.renderContent()}</div>}
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{kpi.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
