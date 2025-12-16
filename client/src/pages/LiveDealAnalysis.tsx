
import React from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import Avatar from '../components/ui/Avatar';
import { 
  Activity, 
  Eye, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  ArrowUpRight,
  Circle
} from 'lucide-react';

const LiveDealAnalysis: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate live deal metrics
  const dealsArray = Object.values(deals);
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const hotDeals = activeDeals.filter(d => d.probability > 70);
  const warmDeals = activeDeals.filter(d => d.probability >= 40 && d.probability <= 70);
  const coldDeals = activeDeals.filter(d => d.probability < 40);

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
          title="Live Deal Analysis"
          subtitle="Real-time deal intelligence and opportunity insights"
        />

        {/* Live Deal KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
                <Circle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-red-400">
                <Activity className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Active Deals</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+5</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {hotDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Hot Deals</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-yellow-400">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Watch</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {warmDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Warm Deals</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <Zap className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Action</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {coldDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Needs Attention</p>
            </div>
          </GlassCard>
        </div>

        {/* Live Deal Temperature Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Activity className="h-5 w-5 mr-2 text-red-500" />
              Deal Temperature Analysis
            </h2>
            <ModernButton variant="glass" size="sm">
              <Circle className="h-4 w-4 mr-2" />
              Real-time
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>🔥 Hot Deals</h3>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {hotDeals.length} deals
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(hotDeals.reduce((sum, deal) => sum + deal.value, 0))} value
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>🌡️ Warm Deals</h3>
                <Eye className="h-5 w-5 text-yellow-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {warmDeals.length} deals
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(warmDeals.reduce((sum, deal) => sum + deal.value, 0))} value
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>❄️ Cold Deals</h3>
                <AlertTriangle className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {coldDeals.length} deals
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(coldDeals.reduce((sum, deal) => sum + deal.value, 0))} value
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Live Deal Activity Feed */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Circle className="h-5 w-5 mr-2 text-green-500" />
              Live Deal Activity Feed
            </h2>
            <ModernButton variant="outline" size="sm">
              View All Activity
            </ModernButton>
          </div>

          <div className="space-y-4">
            {activeDeals.slice(0, 6).map((deal) => (
              <div 
                key={deal.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    deal.probability > 70 ? 'bg-green-500 animate-pulse' :
                    deal.probability >= 40 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <Avatar
                    size="sm"
                    fallback={getInitials((deal as any).contactName || 'UN')}
                  />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {deal.title}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(deal as any).contactName || 'Unknown'} • Last activity: {Math.floor(Math.random() * 5) + 1}h ago
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deal.probability > 70 ? 'bg-green-100 text-green-800' :
                      deal.probability >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {deal.probability}% prob
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Deal Engagement Insights */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
              Real-time Engagement Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { metric: 'Email Opens', value: '89%', change: '+12%', icon: '📧' },
              { metric: 'Response Rate', value: '34%', change: '+8%', icon: '💬' },
              { metric: 'Meeting Acceptance', value: '76%', change: '+15%', icon: '📅' },
              { metric: 'Proposal Views', value: '92%', change: '+5%', icon: '📄' }
            ].map((item, index) => (
              <div key={index} className={`p-4 rounded-lg ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-green-500">{item.change}</span>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.value}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.metric}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Action Items */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Target className="h-5 w-5 mr-2 text-orange-500" />
              Immediate Action Items
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { priority: 'High', action: 'Follow up on Enterprise Software License deal', contact: 'Jane Doe', urgency: 'Overdue by 2 days' },
              { priority: 'Medium', action: 'Send proposal for CRM Integration Services', contact: 'Wade Warren', urgency: 'Due today' },
              { priority: 'High', action: 'Schedule demo for Marketing Automation Platform', contact: 'Darlene Robertson', urgency: 'Due tomorrow' },
              { priority: 'Low', action: 'Research competitor pricing for Cloud Infrastructure', contact: 'Sarah Johnson', urgency: 'Due in 3 days' }
            ].map((item, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-8 rounded-full ${
                    item.priority === 'High' ? 'bg-red-500' :
                    item.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.action}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Contact: {item.contact}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.priority === 'High' ? 'bg-red-100 text-red-800' :
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.urgency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </main>
  );
};

export default LiveDealAnalysis;
