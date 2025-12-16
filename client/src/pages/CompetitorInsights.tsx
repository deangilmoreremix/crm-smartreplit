
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
  Shield, 
  TrendingUp, 
  Target, 
  Eye,
  AlertTriangle,
  BarChart3,
  Users,
  Globe,
  Search,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

const CompetitorInsights: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Mock competitor data
  const competitors = [
    { name: 'Salesforce', marketShare: 23, winRate: 65, avgDealSize: 85000, threat: 'High' },
    { name: 'HubSpot', marketShare: 18, winRate: 58, avgDealSize: 42000, threat: 'Medium' },
    { name: 'Pipedrive', marketShare: 12, winRate: 52, avgDealSize: 28000, threat: 'Low' },
    { name: 'Microsoft Dynamics', marketShare: 15, winRate: 61, avgDealSize: 78000, threat: 'High' }
  ];

  // Calculate competitive metrics
  const dealsArray = Object.values(deals);
  const competitiveDeals = dealsArray.filter(d => Math.random() > 0.6); // Mock competitive deals
  const ourWinRate = 68; // Mock win rate
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
          title="Competitor Insights"
          subtitle="Market intelligence and competitive analysis for strategic advantage"
        />

        {/* Competitive KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-blue-400">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+3.2%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {ourWinRate}%
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Our Win Rate</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-green-400">
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {competitiveDeals.length}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Competitive Deals</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-purple-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Growing</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                12%
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Market Share</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center text-orange-400">
                <Zap className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Alert</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                3
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>High Threat Deals</p>
            </div>
          </GlassCard>
        </div>

        {/* Competitor Landscape */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Competitive Landscape Analysis
            </h2>
            <ModernButton variant="glass" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Research Tools
            </ModernButton>
          </div>

          <div className="space-y-4">
            {competitors.map((competitor, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                } hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${
                      isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    } flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {competitor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {competitor.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {competitor.marketShare}% market share
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {competitor.winRate}%
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Win Rate
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(competitor.avgDealSize)}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Avg Deal
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      competitor.threat === 'High' ? 'bg-red-100 text-red-800' :
                      competitor.threat === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {competitor.threat} Threat
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Competitive Deals Monitor */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Eye className="h-5 w-5 mr-2 text-green-500" />
              Active Competitive Deals
            </h2>
            <ModernButton variant="outline" size="sm">
              View All Deals
            </ModernButton>
          </div>

          <div className="space-y-4">
            {competitiveDeals.slice(0, 5).map((deal) => (
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
                      {getContactInfo(deal.contactId).name} • vs. {competitors[Math.floor(Math.random() * competitors.length)].name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deal.probability > 60 ? 'bg-green-100 text-green-800' :
                      deal.probability >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deal.probability}% vs competitor
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Competitive Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                Win/Loss Analysis
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { reason: 'Better pricing strategy', wins: 12, percentage: 35 },
                { reason: 'Superior product features', wins: 8, percentage: 24 },
                { reason: 'Faster implementation', wins: 7, percentage: 21 },
                { reason: 'Stronger relationships', wins: 6, percentage: 18 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.reason}
                    </p>
                    <div className={`w-full bg-gray-200 rounded-full h-2 mt-2 ${isDark ? 'bg-gray-700' : ''}`}>
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.wins}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      wins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <Target className="h-5 w-5 mr-2 text-purple-500" />
                Competitive Strategies
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { strategy: 'Price Aggressively', effectiveness: 'High', impact: '+15%' },
                { strategy: 'Highlight Unique Features', effectiveness: 'Medium', impact: '+8%' },
                { strategy: 'Leverage Customer Success Stories', effectiveness: 'High', impact: '+12%' },
                { strategy: 'Accelerate Implementation Timeline', effectiveness: 'Medium', impact: '+6%' }
              ].map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.strategy}
                    </h3>
                    <span className={`text-sm font-semibold ${
                      item.effectiveness === 'High' ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {item.impact}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.effectiveness === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.effectiveness} Effectiveness
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
};

export default CompetitorInsights;
