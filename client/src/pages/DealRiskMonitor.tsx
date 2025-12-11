
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DealRiskMonitor: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate risk metrics
  const dealsArray = Object.values(deals);
  const highRiskDeals = dealsArray.filter(deal => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > 7 || deal.probability < 30;
  });
  
  const mediumRiskDeals = dealsArray.filter(deal => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return (daysSinceUpdate >= 3 && daysSinceUpdate <= 7) || (deal.probability >= 30 && deal.probability <= 60);
  });

  const lowRiskDeals = dealsArray.filter(deal => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate < 3 && deal.probability > 60;
  });

  const atRiskValue = highRiskDeals.reduce((sum, deal) => sum + deal.value, 0);

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

  // Get risk level
  const getRiskLevel = (deal: any) => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 7 || deal.probability < 30) return 'high';
    if ((daysSinceUpdate >= 3 && daysSinceUpdate <= 7) || (deal.probability >= 30 && deal.probability <= 60)) return 'medium';
    return 'low';
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-white dark:bg-gray-900" style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Deal Risk Monitor
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Identify and manage at-risk deals to prevent revenue loss
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <Shield className="h-3 w-3 mr-1" />
              Risk Analysis
            </Badge>
          </div>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                High Risk Deals
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {highRiskDeals.length}
              </div>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                Immediate attention needed
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                At Risk Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(atRiskValue)}
              </div>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Revenue at risk
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Medium Risk
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mediumRiskDeals.length}
              </div>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" />
                Monitor closely
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Low Risk
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lowRiskDeals.length}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                On track
              </p>
            </CardContent>
          </Card>
        </div>

        {/* High Risk Deals */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              High Risk Deals - Immediate Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {highRiskDeals.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No high-risk deals found. Great job!</p>
              </div>
            ) : (
              highRiskDeals.map((deal) => {
                const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={deal.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                    isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                  }`}>
                    <Avatar
                      size="md"
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
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {deal.probability}% probability
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {daysSinceUpdate} days inactive
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <XCircle className="h-5 w-5 text-red-500 mb-1" />
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        High Risk
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* All Deals Risk Analysis */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-blue-500" />
              Complete Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dealsArray.map((deal) => {
              const riskLevel = getRiskLevel(deal);
              const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
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
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        riskLevel === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                        riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {riskLevel} risk
                    </Badge>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {deal.probability}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealRiskMonitor;
