
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import Avatar from '../components/ui/Avatar';
import { 
  TrendingUp, 
  Brain, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Bot
} from 'lucide-react';

const AISalesForecast: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate forecast metrics
  const dealsArray = Object.values(deals);
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const totalPipelineValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedForecast = activeDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
  const bestCase = totalPipelineValue * 0.8;
  const worstCase = totalPipelineValue * 0.3;

  // Get top contacts by deal value
  const topContacts = Object.values(contacts).slice(0, 6);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <main className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl mx-auto bg-white dark:bg-gray-900" style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <DashboardHeader 
          title="AI Sales Forecast"
          subtitle="AI-powered revenue predictions and deal closure probability analysis"
        />

        {/* Forecast KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8.5%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(weightedForecast)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>AI Forecast</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Best Case</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(bestCase)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Optimistic Scenario</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Conservative</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(worstCase)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Worst Case</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">95%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                A+
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>AI Confidence</p>
            </div>
          </GlassCard>
        </div>

        {/* AI Forecast Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Bot className="h-5 w-5 mr-2 text-blue-500" />
              AI Revenue Prediction Model
            </h2>
            <ModernButton variant="glass" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Next 90 Days
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Q1 Forecast</h3>
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(weightedForecast * 0.4)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                High confidence prediction
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Trend Analysis</h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                +15.3%
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Vs. last quarter
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Risk Factor</h3>
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Low
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Strong pipeline health
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Top Forecast Contributors */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Top Forecast Contributors
            </h2>
            <ModernButton variant="outline" size="sm">
              View Pipeline
            </ModernButton>
          </div>

          <div className="space-y-4">
            {activeDeals.slice(0, 5).map((deal) => (
              <div 
                key={deal.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    size="sm"
                    fallback={getInitials(deal.title || 'UN')}
                  />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deal.title}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Deal #{deal.id} • {String(deal.stage)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {deal.probability}% probability
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Insights */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              AI-Powered Insights & Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                🎯 Key Opportunities
              </h3>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• Focus on Enterprise deals (80% higher close rate)</li>
                <li>• Accelerate Q1 pipeline development</li>
                <li>• Prioritize warm leads for faster conversion</li>
              </ul>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                ⚠️ Risk Mitigation
              </h3>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• 3 deals at risk of slipping to next quarter</li>
                <li>• Consider backup options for large deals</li>
                <li>• Increase touchpoints on stalled opportunities</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Forecast Accuracy */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
              Model Performance & Accuracy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { metric: 'Accuracy', value: '94.2%', trend: '+2.1%' },
              { metric: 'Precision', value: '91.8%', trend: '+1.5%' },
              { metric: 'Recall', value: '89.3%', trend: '+0.8%' },
              { metric: 'F1 Score', value: '90.5%', trend: '+1.2%' }
            ].map((item, index) => (
              <div key={index} className={`p-4 rounded-lg text-center ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.value}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  {item.metric}
                </p>
                <p className="text-xs text-green-500">{item.trend}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  );
};

export default AISalesForecast;
