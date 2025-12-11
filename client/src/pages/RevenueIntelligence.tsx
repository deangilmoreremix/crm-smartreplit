
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
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
  Trophy
} from 'lucide-react';

const RevenueIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate revenue metrics
  const dealsArray = Object.values(deals);
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won');
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  
  const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const projectedRevenue = activeDeals.reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0);
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
  const revenueGrowth = 15.3; // Mock growth percentage

  // Get top revenue contributors
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

  // Get contact info from contactId
  const getContactInfo = (contactId: number | string | null) => {
    if (!contactId) return { name: 'Unknown Contact', initials: 'UC' };
    const contact = contacts[contactId];
    if (!contact) return { name: 'Unknown Contact', initials: 'UC' };
    return {
      name: contact.name,
      initials: contact.name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
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
                <span className="text-sm font-medium">+{revenueGrowth}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(totalRevenue)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Revenue</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <Brain className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">AI Forecast</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(projectedRevenue)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Projected Revenue</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8.2%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(avgDealSize)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Avg Deal Size</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <Trophy className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Target</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                125%
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Goal Achievement</p>
            </div>
          </GlassCard>
        </div>

        {/* Revenue Trend Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Revenue Trend Analysis
            </h2>
            <ModernButton variant="glass" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 12 Months
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Q4 Performance</h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(totalRevenue * 0.35)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                +22% vs Q3
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Recurring</h3>
                <PieChart className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(totalRevenue * 0.15)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Subscription revenue
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Growth Rate</h3>
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                +{revenueGrowth}%
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Year over year
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Top Revenue Contributors */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
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
                  <Avatar
                    size="sm"
                    fallback={getContactInfo(deal.contactId).initials}
                  />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deal.title}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getContactInfo(deal.contactId).name} • Closed {Math.floor(Math.random() * 30) + 1} days ago
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
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                AI Revenue Insights
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { insight: 'Enterprise deals show 35% higher close rates', type: 'opportunity', value: '+$180K potential' },
                { insight: 'Q1 pipeline is 120% of target', type: 'positive', value: 'On track' },
                { insight: 'Average sales cycle decreased by 8 days', type: 'improvement', value: 'Velocity up' },
                { insight: 'Upsell opportunities identified in 12 accounts', type: 'opportunity', value: '+$95K potential' }
              ].map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.insight}
                    </p>
                    <span className={`text-sm font-semibold ${
                      item.type === 'positive' ? 'text-green-500' :
                      item.type === 'opportunity' ? 'text-blue-500' : 'text-purple-500'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.type === 'positive' ? 'bg-green-100 text-green-800' :
                    item.type === 'opportunity' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {item.type === 'positive' ? '✅ Success' : 
                     item.type === 'opportunity' ? '🎯 Opportunity' : '📈 Improvement'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Target className="h-5 w-5 mr-2 text-orange-500" />
                Revenue Optimization
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { metric: 'Revenue per Lead', current: '$850', target: '$1,200', progress: 71 },
                { metric: 'Customer Lifetime Value', current: '$45K', target: '$60K', progress: 75 },
                { metric: 'Sales Conversion Rate', current: '18%', target: '25%', progress: 72 },
                { metric: 'Average Deal Velocity', current: '45 days', target: '35 days', progress: 78 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.metric}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.current} / {item.target}
                    </span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-gray-700' : ''}`}>
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.progress}% of target
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Revenue Forecast */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <PieChart className="h-5 w-5 mr-2 text-blue-500" />
              Revenue Forecast & Planning
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { period: 'Q1 2024', forecast: projectedRevenue * 0.25, confidence: '95%', trend: '+12%' },
              { period: 'Q2 2024', forecast: projectedRevenue * 0.28, confidence: '88%', trend: '+15%' },
              { period: 'Q3 2024', forecast: projectedRevenue * 0.22, confidence: '76%', trend: '+8%' },
              { period: 'Q4 2024', forecast: projectedRevenue * 0.25, confidence: '65%', trend: '+18%' }
            ].map((item, index) => (
              <div key={index} className={`p-4 rounded-lg text-center ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(item.forecast)}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  {item.period}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-500">{item.confidence}</span>
                  <span className="text-green-500">{item.trend}</span>
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
