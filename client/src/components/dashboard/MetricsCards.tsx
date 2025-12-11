import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';

const MetricsCards: React.FC = () => {
  const { isDark } = useTheme();
  const { navigateToFeature } = useNavigation();

  const kpis = [
    {
      title: 'Active Deals',
      value: '34',
      change: '+12%',
      trend: 'up',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      feature: 'pipeline-section'
    },
    {
      title: 'Pipeline Value',
      value: '$247K',
      change: '+8%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      feature: 'pipeline-section'
    },
    {
      title: 'Won Deals',
      value: '20',
      change: '+15%',
      trend: 'up',
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      feature: 'analytics-section'
    },
    {
      title: 'Avg Deal Size',
      value: '$12.3K',
      change: '-3%',
      trend: 'down',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      feature: 'analytics-section'
    }
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
            <div className={`flex items-center ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {kpi.trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">{kpi.change}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}>
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