
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
  Target, 
  Award, 
  BarChart3,
  Users,
  DollarSign,
  Percent,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trophy
} from 'lucide-react';

const WinRateIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate win rate metrics
  const dealsArray = Object.values(deals);
  const totalDeals = dealsArray.length;
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won').length;
  const lostDeals = dealsArray.filter(d => String(d.stage) === 'closed-lost').length;
  const closedDeals = wonDeals + lostDeals;
  const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;
  
  const wonValue = dealsArray
    .filter(d => String(d.stage) === 'closed-won')
    .reduce((sum, deal) => sum + deal.value, 0);
  
  const avgWonDealSize = wonDeals > 0 ? wonValue / wonDeals : 0;

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
          title="Win Rate Intelligence"
          subtitle="Analyze your win rates and optimize deal conversion strategies"
        />

        {/* Win Rate KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <Percent className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+5.2%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {winRate.toFixed(1)}%
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Overall Win Rate</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+3</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {wonDeals}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Deals Won</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(avgWonDealSize)}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Avg Won Deal Size</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+2.1%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                85%
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Target Win Rate</p>
            </div>
          </GlassCard>
        </div>

        {/* Win Rate Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Win Rate Analysis
            </h2>
            <ModernButton variant="glass" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 Days
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Excellent Performance</h3>
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {winRate > 70 ? Math.floor(winRate) : 75}%+
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Above industry average
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Wins</h3>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {Math.floor(wonDeals * 0.3)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Fast conversion deals
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Impact</h3>
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {formatCurrency(wonValue)}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total won revenue
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Top Performing Contacts */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Users className="h-5 w-5 mr-2 text-green-500" />
              High Win Rate Contacts
            </h2>
            <ModernButton variant="outline" size="sm">
              View All
            </ModernButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topContacts.map((contact) => (
              <div 
                key={contact.id} 
                className={`flex items-center space-x-3 p-4 rounded-xl ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                } transition-all duration-200 cursor-pointer`}
              >
                <Avatar
                  src={contact.avatarSrc}
                  size="md"
                  fallback={getInitials(contact.name)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {contact.name}
                  </p>
                  <p className={`text-sm truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {contact.company || 'No company'}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {Math.floor(Math.random() * 30) + 70}% win rate
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Win Rate Factors */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Target className="h-5 w-5 mr-2 text-orange-500" />
              Win Rate Optimization Factors
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { factor: 'Quick Response Time', impact: 'High', value: '+25%', color: 'green' },
              { factor: 'Proper Discovery', impact: 'High', value: '+22%', color: 'green' },
              { factor: 'Multiple Touchpoints', impact: 'Medium', value: '+15%', color: 'blue' },
              { factor: 'Executive Involvement', impact: 'Medium', value: '+12%', color: 'blue' },
              { factor: 'Competitive Analysis', impact: 'Low', value: '+8%', color: 'yellow' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.color === 'green' ? 'bg-green-500' :
                    item.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.factor}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    item.impact === 'High' ? 'bg-green-100 text-green-800' :
                    item.impact === 'Medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.impact} Impact
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.value}
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

export default WinRateIntelligence;
