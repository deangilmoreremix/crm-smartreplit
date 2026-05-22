import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import PageLayout from '../components/PageLayout';
import { useDealRiskMonitor } from '../hooks/useAIAnalysis';
import {
  Shield, AlertTriangle, Clock, TrendingDown, DollarSign, Users,
  Target, Activity, CheckCircle, XCircle, Sparkles,
} from 'lucide-react';

const DealRiskMonitor: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { loading, riskAnalysis, analyze } = useDealRiskMonitor();

  const dealsArray = Object.values(deals);

  useEffect(() => {
    if (dealsArray.length > 0) analyze(dealsArray);
  }, []);

  // Use AI risk analysis if available
  const highRisk = riskAnalysis?.high_risk || [];
  const mediumRisk = riskAnalysis?.medium_risk || [];
  const lowRisk = riskAnalysis?.low_risk || [];
  const totalAtRiskValue = riskAnalysis?.total_at_risk_value || 0;
  const summary = riskAnalysis?.summary || '';

  // Fallback computed risk
  const computedHighRisk = dealsArray.filter(deal => {
    const days = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 7 || deal.probability < 30;
  });
  const computedMediumRisk = dealsArray.filter(deal => {
    const days = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return (days >= 3 && days <= 7) || (deal.probability >= 30 && deal.probability <= 60);
  });
  const computedLowRisk = dealsArray.filter(deal => {
    const days = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days < 3 && deal.probability > 60;
  });

  const displayHighRisk = highRisk.length > 0 ? highRisk : computedHighRisk;
  const displayMediumRisk = mediumRisk.length > 0 ? mediumRisk : computedMediumRisk;
  const displayLowRisk = lowRisk.length > 0 ? lowRisk : computedLowRisk;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getContactInfo = (contactId: number | string | null) => {
    if (!contactId) return { name: 'Unknown Contact', initials: 'UC' };
    const contact = contacts[contactId];
    if (!contact) return { name: 'Unknown Contact', initials: 'UC' };
    const name = `${contact.firstName} ${contact.lastName}`;
    return { name, initials: `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() };
  };

  const getRiskLevel = (deal: any) => {
    const days = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 7 || deal.probability < 30) return 'high';
    if ((days >= 3 && days <= 7) || (deal.probability >= 30 && deal.probability <= 60)) return 'medium';
    return 'low';
  };

  return (
    <PageLayout
      title="Deal Risk Monitor"
      description="Identify and manage at-risk deals to prevent revenue loss"
      actions={
        <div className="flex items-center gap-2">
          {riskAnalysis && <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Sparkles className="h-3 w-3 mr-1" />AI-Powered</Badge>}
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><Shield className="h-3 w-3 mr-1" />Risk Analysis</Badge>
        </div>
      }
    >
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>High Risk Deals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayHighRisk.length}</div>
            <p className="text-xs text-red-600 flex items-center mt-1"><TrendingDown className="h-3 w-3 mr-1" />Immediate attention needed</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>At Risk Value</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalAtRiskValue || displayHighRisk.reduce((s: number, d: any) => s + (d.value || 0), 0))}</div>
            <p className="text-xs text-orange-600 flex items-center mt-1"><AlertTriangle className="h-3 w-3 mr-1" />Revenue at risk</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Medium Risk</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayMediumRisk.length}</div>
            <p className="text-xs text-yellow-600 flex items-center mt-1"><Clock className="h-3 w-3 mr-1" />Monitor closely</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Low Risk</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayLowRisk.length}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><CheckCircle className="h-3 w-3 mr-1" />On track</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Risk Summary */}
      {summary && (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l-4 border-purple-500`}>
          <CardContent className="pt-6">
            <div className="flex items-start">
              <Sparkles className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Risk Deals */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" /> High Risk Deals - Immediate Action Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayHighRisk.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No high-risk deals found. Great job!</p>
            </div>
          ) : (
            displayHighRisk.map((deal: any) => {
              const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
              const riskFactors = deal.riskFactors || deal.risk_factors || [];
              const recommendedAction = deal.recommendedAction || deal.recommended_action || 'Review and follow up immediately';

              return (
                <div key={deal.id || deal.dealId} className={`flex items-center space-x-3 p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <Avatar size="md" fallback={getContactInfo(deal.contactId).initials} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.title}</p>
                    <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getContactInfo(deal.contactId).name} • {formatCurrency(deal.value)}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">{deal.probability}% probability</Badge>
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">{daysSinceUpdate} days inactive</Badge>
                      {riskFactors.length > 0 && riskFactors.map((rf: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">{rf}</Badge>
                      ))}
                    </div>
                    {recommendedAction && (
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="font-medium">Action:</span> {recommendedAction}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <XCircle className="h-5 w-5 text-red-500 mb-1" />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>High Risk</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* All Deals Risk Analysis */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Activity className="h-5 w-5 mr-2 text-blue-500" /> Complete Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dealsArray.map(deal => {
            const riskLevel = getRiskLevel(deal);
            return (
              <div key={deal.id} className="flex items-center space-x-3">
                <Avatar size="sm" fallback={getContactInfo(deal.contactId).initials} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.title}</p>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getContactInfo(deal.contactId).name} • {formatCurrency(deal.value)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={`text-xs ${riskLevel === 'high' ? 'bg-red-50 text-red-700 border-red-200' : riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {riskLevel} risk
                  </Badge>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{deal.probability}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default DealRiskMonitor;
