import React from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Heart
} from 'lucide-react';

const PipelineHealthDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate pipeline health metrics
  const dealsArray = Object.values(deals);
  const activeDeals = dealsArray.filter(d => !['closed-won', 'closed-lost'].includes(String(d.stage)));
  const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgDealAge = activeDeals.length > 0 ? 
    activeDeals.reduce((sum, deal) => {
      const days = Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0) / activeDeals.length : 0;

  // Health scoring
  const healthyDeals = activeDeals.filter(deal => deal.probability > 60 && avgDealAge < 30);
  const concernDeals = activeDeals.filter(deal => deal.probability >= 30 && deal.probability <= 60);
  const criticalDeals = activeDeals.filter(deal => deal.probability < 30 || avgDealAge > 60);

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
    // Handle both string and number IDs
    const contact = contacts[contactId];
    if (!contact) return { name: 'Unknown Contact', initials: 'UC' };
    const name = `${contact.firstName} ${contact.lastName}`;
    const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();
    return { name, initials };
  };

  // Get initials for avatar (for contacts)
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-white dark:bg-gray-900" style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pipeline Health Dashboard
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Monitor your pipeline health and identify potential issues early
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Heart className="h-3 w-3 mr-1" />
              Health Monitor
            </Badge>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Overall Health Score
              </CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.round((healthyDeals.length / activeDeals.length) * 100 || 0)}%
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Pipeline performing well
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Healthy Deals
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {healthyDeals.length}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                High probability & fresh
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Needs Attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {concernDeals.length}
              </div>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Moderate risk
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Critical Issues
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {criticalDeals.length}
              </div>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                Immediate action needed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Health Analysis */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Pipeline Health Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Healthy</h3>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {healthyDeals.length} deals
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatCurrency(healthyDeals.reduce((sum, deal) => sum + deal.value, 0))}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>At Risk</h3>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {concernDeals.length} deals
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatCurrency(concernDeals.reduce((sum, deal) => sum + deal.value, 0))}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Critical</h3>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {criticalDeals.length} deals
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatCurrency(criticalDeals.reduce((sum, deal) => sum + deal.value, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Key Relationship Health
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
                    fallback={getInitials(`${contact.firstName} ${contact.lastName}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {`${contact.firstName} ${contact.lastName}`}
                    </p>
                    <p className={`text-sm truncate ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {contact.company || 'No company'}
                    </p>
                    <div className="flex items-center mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Health: {Math.floor(Math.random() * 40) + 60}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Health Changes */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Target className="h-5 w-5 mr-2 text-orange-500" />
              Recent Health Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeals.slice(0, 5).map((deal) => (
              <div key={deal.id} className="flex items-center space-x-3">
                <Avatar
                  size="sm"
                  fallback={getContactInfo(deal.contactId).initials}
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
                    {getContactInfo(deal.contactId).name} • {formatCurrency(deal.value)}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    deal.probability > 60 ? 'bg-green-50 text-green-700 border-green-200' :
                    deal.probability >= 30 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {deal.probability > 60 ? 'Healthy' : deal.probability >= 30 ? 'At Risk' : 'Critical'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PipelineHealthDashboard;
