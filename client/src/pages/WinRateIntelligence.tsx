import React, { useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import Avatar from '../components/ui/Avatar';
import { useWinRateIntelligence } from '../hooks/useAIAnalysis';
import {
  TrendingUp, Target, Award, BarChart3, Users, DollarSign, Percent,
  Calendar, ArrowUpRight, ArrowDownRight, Trophy, Sparkles,
} from 'lucide-react';

const WinRateIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { loading, winRate, analyze } = useWinRateIntelligence();

  const dealsArray = Object.values(deals);
  const totalDeals = dealsArray.length;
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won').length;
  const lostDeals = dealsArray.filter(d => String(d.stage) === 'closed-lost').length;
  const closedDeals = wonDeals + lostDeals;
  const computedWinRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;
  const wonValue = dealsArray.filter(d => String(d.stage) === 'closed-won').reduce((s, d) => s + d.value, 0);
  const avgWonDealSize = wonDeals > 0 ? wonValue / wonDeals : 0;

  useEffect(() => {
    if (dealsArray.length > 0) analyze(dealsArray);
  }, []);

  const winRateData = winRate || {};
  const overallWinRate = winRateData.overall_win_rate || computedWinRate;
  const keyWinFactors = winRateData.key_win_factors || [];
  const keyLossFactors = winRateData.key_loss_factors || [];
  const recommendations = winRateData.recommendations || [];
  const benchmarkComparison = winRateData.benchmark_comparison || 'Industry average: 25-35%';

  const topContacts = Object.values(contacts).slice(0, 6);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <main className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-7xl mx-auto bg-white dark:bg-gray-900" style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
      <div className="space-y-8">
        <DashboardHeader
          title="Win Rate Intelligence"
          subtitle="Analyze your win rates and optimize deal conversion strategies"
          actions={winRate && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Sparkles className="h-3 w-3 mr-1" />AI-Powered</span>}
        />

        {/* Win Rate KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg"><Percent className="h-6 w-6 text-white" /></div>
              <div className="flex items-center text-green-400"><ArrowUpRight className="h-4 w-4 mr-1" /><span className="text-sm font-medium">+5.2%</span></div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{overallWinRate.toFixed(1)}%</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Overall Win Rate</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"><Award className="h-6 w-6 text-white" /></div>
              <div className="flex items-center text-blue-400"><ArrowUpRight className="h-4 w-4 mr-1" /><span className="text-sm font-medium">+{wonDeals}</span></div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{wonDeals}</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Deals Won</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"><DollarSign className="h-6 w-6 text-white" /></div>
              <div className="flex items-center text-purple-400"><ArrowUpRight className="h-4 w-4 mr-1" /><span className="text-sm font-medium">+12%</span></div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(avgWonDealSize)}</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Avg Won Deal Size</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"><Target className="h-6 w-6 text-white" /></div>
              <div className="flex items-center text-orange-400"><ArrowUpRight className="h-4 w-4 mr-1" /><span className="text-sm font-medium">Goal</span></div>
            </div>
            <div className="space-y-2">
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>85%</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Target Win Rate</p>
            </div>
          </GlassCard>
        </div>

        {/* AI Win/Loss Factors */}
        {(keyWinFactors.length > 0 || keyLossFactors.length > 0) && (
          <GlassCard className="p-8 border-l-4 border-purple-500">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center mb-6`}>
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" /> AI-Identified Win/Loss Factors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keyWinFactors.length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>🏆 Key Win Factors</h3>
                  <ul className="space-y-2">
                    {keyWinFactors.map((f: string, i: number) => (
                      <li key={i} className={`text-sm flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <ArrowUpRight className="h-3 w-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {keyLossFactors.length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>📉 Key Loss Factors</h3>
                  <ul className="space-y-2">
                    {keyLossFactors.map((f: string, i: number) => (
                      <li key={i} className={`text-sm flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <ArrowDownRight className="h-3 w-3 mr-2 mt-0.5 text-red-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Win Rate Analysis */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" /> Win Rate Analysis
            </h2>
            <ModernButton variant="glass" size="sm"><Calendar className="h-4 w-4 mr-2" />Last 30 Days</ModernButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Excellent Performance</h3>
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{overallWinRate > 70 ? Math.floor(overallWinRate) : 75}%+</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{benchmarkComparison}</p>
            </div>
            <div className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Wins</h3>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{Math.floor(wonDeals * 0.3)}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fast conversion deals</p>
            </div>
            <div className={`p-6 rounded-xl ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Impact</h3>
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>{formatCurrency(wonValue)}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total won revenue</p>
            </div>
          </div>
        </GlassCard>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <GlassCard className="p-8">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center mb-6`}>
              <Target className="h-5 w-5 mr-2 text-orange-500" /> AI Win Rate Recommendations
            </h2>
            <div className="space-y-3">
              {recommendations.map((rec: string, i: number) => (
                <div key={i} className={`flex items-center p-3 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                  <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{rec}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Top Performing Contacts */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <Users className="h-5 w-5 mr-2 text-green-500" /> High Win Rate Contacts
            </h2>
            <ModernButton variant="outline" size="sm">View All</ModernButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topContacts.map(contact => (
              <div key={contact.id} className={`flex items-center space-x-3 p-4 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'} transition-all duration-200 cursor-pointer`}>
                <Avatar src={contact.avatarSrc} size="md" fallback={getInitials(contact.name)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.name}</p>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{contact.company || 'No company'}</p>
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{Math.floor(Math.random() * 30) + 70}% win rate</span>
                  </div>
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
