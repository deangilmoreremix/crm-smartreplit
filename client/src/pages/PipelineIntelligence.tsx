
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import PageLayout from '../components/PageLayout';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Activity,
  Briefcase,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const PipelineIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate pipeline metrics
  const dealsArray = Object.values(deals);
  const totalValue = dealsArray.reduce((sum, deal) => sum + deal.value, 0);
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const wonDeals = dealsArray.filter(d => String(d.stage) === 'closed-won');
  const avgDealSize = activeDeals.length > 0 ? totalValue / activeDeals.length : 0;

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
    <PageLayout
      title="Pipeline Intelligence"
      description="Advanced analytics and insights for your sales pipeline"
      actions={
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Activity className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      }
    >

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Pipeline Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(totalValue)}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Deals
              </CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeDeals.length}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8 new this week
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Average Deal Size
              </CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(avgDealSize)}
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +5.2% increase
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Won Deals
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {wonDeals.length}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                85% win rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stages Analysis */}
        <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Pipeline Stage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'].map((stage, index) => {
                const stageDeals = dealsArray.filter(d => String(d.stage).toLowerCase().includes(stage.toLowerCase()));
                const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                
                return (
                  <div 
                    key={stage}
                    className={`p-4 rounded-lg ${
                      isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      {stage}
                    </div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {stageDeals.length} deals
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatCurrency(stageValue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Contacts */}
        <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              High-Value Business Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className={`flex items-center space-x-3 p-4 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  } transition-colors cursor-pointer`}
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
                      <Badge variant="secondary" className="text-xs">
                        {(contact as any).leadScore || 85}/100
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Pipeline Activity */}
        <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-orange-500" />
              Recent Pipeline Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dealsArray.slice(0, 5).map((deal) => (
              <div key={deal.id} className="flex items-center space-x-3">
                <Avatar
                  size="sm"
                  fallback={getInitials((deal as any).contactName || 'UN')}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {deal.title}
                  </p>
                  <p className={`text-sm truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {(deal as any).contactName || 'Unknown'} • {formatCurrency(deal.value)}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    String(deal.stage) === 'closed-won' ? 'bg-green-50 text-green-700 border-green-200' :
                    String(deal.stage) === 'negotiation' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {String(deal.stage)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
    </PageLayout>
  );
};

export default PipelineIntelligence;
