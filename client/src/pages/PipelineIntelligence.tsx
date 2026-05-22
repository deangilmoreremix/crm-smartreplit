import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import PageLayout from '../components/PageLayout';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { aiSalesTools } from '../services/aiToolsApiService';
import {
  BarChart3, TrendingUp, DollarSign, Users, Target, Activity,
  Briefcase, Star, ArrowUpRight, ArrowDownRight, Sparkles,
} from 'lucide-react';

const PipelineIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { loading, data, execute } = useAIAnalysis();

  const dealsArray = Object.values(deals);
  const totalValue = dealsArray.reduce((s, d) => s + d.value, 0);
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won');
  const avgDealSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;
  const topContacts = Object.values(contacts).slice(0, 6);

  useEffect(() => {
    if (activeDeals.length > 0) execute(() => aiSalesTools.pipelineIntelligence(activeDeals));
  }, []);

  const intel = data?.analysis || {};
  const healthScore = intel.overall_health_score || 0;
  const bottlenlenecks = intel.bottlenecks || [];
  const recommendations = intel.recommendations || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <PageLayout
      title="Pipeline Intelligence"
      description="Deep insights into your sales pipeline performance"
      actions={
        <div className="flex items-center gap-2">
          {data && <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Sparkles className="h-3 w-3 mr-1" />AI-Powered</Badge>}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><BarChart3 className="h-3 w-3 mr-1" />Pipeline AI</Badge>
        </div>
      }
    >
      {/* Pipeline KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalValue)}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1" />{activeDeals.length} active deals</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Avg Deal Size</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(avgDealSize)}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" />Per deal average</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Health Score</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{healthScore || Math.round((wonDeals.length / Math.max(dealsArray.length, 1)) * 100)}%</div>
            <p className="text-xs text-purple-600 flex items-center mt-1"><Star className="h-3 w-3 mr-1" />Pipeline health</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Won Deals</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{wonDeals.length}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1" />{formatCurrency(wonDeals.reduce((s, d) => s + d.value, 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l-4 border-purple-500`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="h-5 w-5 mr-2 text-purple-500" /> AI Pipeline Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec: string, i: number) => (
                <li key={i} className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="mr-2">•</span>{rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Bottlenecks */}
      {bottlenlenecks.length > 0 && (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <ArrowDownRight className="h-5 w-5 mr-2 text-orange-500" /> Identified Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottlenlenecks.map((b: string, i: number) => (
                <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{b}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline by Stage */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" /> Pipeline by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(dealsArray.map(d => String(d.stage)))).map(stage => {
              const stageDeals = dealsArray.filter(d => String(d.stage) === stage);
              return (
                <div key={stage} className={`p-4 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-sm font-medium capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{stage.replace(/-/g, ' ')}</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stageDeals.length}</p>
                  <p className="text-xs text-blue-500">{formatCurrency(stageDeals.reduce((s, d) => s + d.value, 0))}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Contacts */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Users className="h-5 w-5 mr-2 text-purple-500" /> Key Pipeline Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topContacts.map(contact => (
              <div key={contact.id} className={`flex items-center space-x-3 p-4 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}>
                <Avatar src={contact.avatarSrc} size="md" fallback={getInitials(`${contact.firstName} ${contact.lastName}`)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{`${contact.firstName} ${contact.lastName}`}</p>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{contact.company || 'No company'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default PipelineIntelligence;
