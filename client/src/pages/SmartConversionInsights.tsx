import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import PageLayout from '../components/PageLayout';
import { useConversionOptimization } from '../hooks/useAIAnalysis';
import {
  Zap, TrendingUp, Target, Users, ArrowUpRight, ArrowDownRight,
  Star, Activity, Lightbulb, CheckCircle, Sparkles,
} from 'lucide-react';

const SmartConversionInsights: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { loading, optimization, optimize } = useConversionOptimization();

  const dealsArray = Object.values(deals);
  const contactsArray = Object.values(contacts);
  const totalDeals = dealsArray.length;
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won');
  const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const highPotentialDeals = dealsArray.filter(d => d.probability >= 70 && !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const stuckDeals = dealsArray.filter(d => {
    const days = Math.floor((Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 14 && !['closed-won', 'closed-lost'].includes(String(d.stage));
  });
  const topContacts = contactsArray.slice(0, 6);

  useEffect(() => {
    if (dealsArray.length > 0) optimize(dealsArray, contactsArray);
  }, []);

  const optData = optimization || {};
  const aiConversionRate = optData.conversion_rate || conversionRate;
  const dropOffPoints = optData.drop_off_points || [];
  const optimizationOpportunities = optData.optimization_opportunities || [];
  const abTestSuggestions = optData.a_b_test_suggestions || [];
  const projectedImprovement = optData.projected_improvement || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <PageLayout
      title="Smart Conversion Insights"
      description="AI-powered conversion optimization and funnel analysis"
      actions={
        <div className="flex items-center gap-2">
          {optimization && <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Sparkles className="h-3 w-3 mr-1" />AI-Powered</Badge>}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Zap className="h-3 w-3 mr-1" />Conversion AI</Badge>
        </div>
      }
    >
      {/* Conversion KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" />{projectedImprovement > 0 ? `+${projectedImprovement}% projected` : 'Optimizing'}</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>High Potential</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{highPotentialDeals.length}</div>
            <p className="text-xs text-yellow-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" />Ready to close</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Stuck Deals</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stuckDeals.length}</div>
            <p className="text-xs text-red-600 flex items-center mt-1"><ArrowDownRight className="h-3 w-3 mr-1" />Need attention</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Won Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(wonDeals.reduce((s, d) => s + d.value, 0))}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><CheckCircle className="h-3 w-3 mr-1" />Total won</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Optimization Opportunities */}
      {optimizationOpportunities.length > 0 && (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l-4 border-purple-500`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" /> AI Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationOpportunities.map((opp: string, i: number) => (
                <div key={i} className={`flex items-center p-3 rounded-lg ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                  <Lightbulb className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                  <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{opp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drop-off Points */}
      {dropOffPoints.length > 0 && (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <ArrowDownRight className="h-5 w-5 mr-2 text-red-500" /> Identified Drop-off Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dropOffPoints.map((point: string, i: number) => (
                <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B Test Suggestions */}
      {abTestSuggestions.length > 0 && (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Zap className="h-5 w-5 mr-2 text-yellow-500" /> A/B Test Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {abTestSuggestions.map((suggestion: string, i: number) => (
                <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Potential Deals */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Target className="h-5 w-5 mr-2 text-green-500" /> High Conversion Potential Deals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {highPotentialDeals.length === 0 ? (
            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No high-potential deals identified yet.</p>
          ) : (
            highPotentialDeals.map(deal => (
              <div key={deal.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <Avatar size="md" fallback={getInitials(deal.title || 'UN')} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.title}</p>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatCurrency(deal.value)} • {deal.probability}% probability</p>
                </div>
                <Badge className="bg-green-100 text-green-800">High Potential</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default SmartConversionInsights;
