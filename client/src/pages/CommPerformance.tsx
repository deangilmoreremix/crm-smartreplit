
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  BarChart3,
  PieChart,
  Activity,
  Users,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const CommPerformance: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate communication ROI metrics
  const totalInvestment = 12500; // Communication tools and time investment
  const generatedRevenue = 156000; // Revenue attributed to communications
  const roi = Math.round(((generatedRevenue - totalInvestment) / totalInvestment) * 100);
  const conversionRate = 18.5; // percentage

  // Get contacts for performance analysis
  const topContacts = Object.values(contacts).slice(0, 6);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const performanceMetrics = [
    {
      channel: 'Email Marketing',
      investment: 3200,
      revenue: 45000,
      roi: 1306,
      conversions: 23,
      avgDealSize: 1956
    },
    {
      channel: 'Phone Outreach',
      investment: 4800,
      revenue: 67000,
      roi: 1296,
      conversions: 18,
      avgDealSize: 3722
    },
    {
      channel: 'Video Calls',
      investment: 2100,
      revenue: 28000,
      roi: 1233,
      conversions: 8,
      avgDealSize: 3500
    },
    {
      channel: 'SMS Campaigns',
      investment: 1200,
      revenue: 12000,
      roi: 900,
      conversions: 12,
      avgDealSize: 1000
    },
    {
      channel: 'Social Media',
      investment: 1200,
      revenue: 4000,
      roi: 233,
      conversions: 4,
      avgDealSize: 1000
    }
  ];

  const monthlyTrends = [
    { month: 'Jan', investment: 10200, revenue: 125000, roi: 1125 },
    { month: 'Feb', investment: 11500, revenue: 138000, roi: 1100 },
    { month: 'Mar', investment: 12500, revenue: 156000, roi: 1148 },
    { month: 'Apr', investment: 13200, revenue: 167000, roi: 1165 },
    { month: 'May', investment: 12800, revenue: 172000, roi: 1244 },
    { month: 'Jun', investment: 12500, revenue: 156000, roi: roi }
  ];

  const topPerformingContacts = [
    { contact: 'Jane Doe', revenue: 25000, communications: 12, roi: 1950, channel: 'Email' },
    { contact: 'Darlene Robertson', revenue: 18000, communications: 8, roi: 1800, channel: 'Phone' },
    { contact: 'Wade Warren', revenue: 15000, communications: 15, roi: 900, channel: 'Video' },
    { contact: 'Kathryn Murphy', revenue: 12000, communications: 6, roi: 1900, channel: 'Email' },
    { contact: 'Jerome Bell', revenue: 10000, communications: 10, roi: 900, channel: 'SMS' },
    { contact: 'Courtney Henry', revenue: 8000, communications: 5, roi: 1500, channel: 'Phone' }
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'video': return Calendar;
      case 'sms': return MessageSquare;
      default: return Activity;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return 'text-blue-500';
      case 'phone': return 'text-green-500';
      case 'video': return 'text-purple-500';
      case 'sms': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 1000) return 'text-green-600';
    if (roi >= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Communication Performance
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Communication ROI analysis and performance optimization insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              ROI Tracking
            </Badge>
          </div>
        </div>

        {/* ROI Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Investment
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(totalInvestment)}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8% this month
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generated Revenue
              </CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(generatedRevenue)}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +15% this month
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Overall ROI
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {roi}%
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Excellent performance
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Conversion Rate
              </CardTitle>
              <PieChart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {conversionRate}%
              </div>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +3% improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Performance Analysis */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Communication Channel ROI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => {
                const ChannelIcon = getChannelIcon(metric.channel.split(' ')[0]);
                return (
                  <div key={index} className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <ChannelIcon className={`h-5 w-5 ${getChannelColor(metric.channel.split(' ')[0])}`} />
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {metric.channel}
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {metric.conversions} conversions • Avg deal: {formatCurrency(metric.avgDealSize)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRoiColor(metric.roi)}`}>
                          {metric.roi}% ROI
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatCurrency(metric.revenue)} revenue
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Investment: {formatCurrency(metric.investment)}
                      </div>
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Revenue: {formatCurrency(metric.revenue)}
                      </div>
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Profit: {formatCurrency(metric.revenue - metric.investment)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly ROI Trends */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Monthly ROI Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {monthlyTrends.map((trend, index) => (
                <div 
                  key={trend.month}
                  className={`p-4 rounded-lg text-center ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    {trend.month}
                  </div>
                  <div className={`text-lg font-bold mb-1 ${getRoiColor(trend.roi)}`}>
                    {trend.roi}%
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ROI
                  </div>
                  <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatCurrency(trend.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Contacts */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Top Performing Contacts by Communication ROI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformingContacts.map((item, index) => {
              const ChannelIcon = getChannelIcon(item.channel);
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <Avatar
                      size="sm"
                      fallback={getInitials(item.contact)}
                    />
                    <div>
                      <p className={`font-medium text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.contact}
                      </p>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {item.communications} communications
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(item.revenue)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Revenue
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <ChannelIcon className={`h-4 w-4 ${getChannelColor(item.channel)}`} />
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.roi >= 1500 ? 'bg-green-50 text-green-700 border-green-200' :
                          item.roi >= 1000 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {item.roi}% ROI
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-orange-500" />
              Performance Optimization Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Outstanding Overall Performance
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your communication ROI of {roi}% significantly exceeds industry average of 400%. Continue current strategies.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Email Marketing Excellence
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email campaigns show highest ROI at 1306%. Scale this channel for maximum impact.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-start space-x-3">
                <ArrowUpRight className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Social Media Optimization Opportunity
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Social media ROI of 233% has room for improvement. Consider A/B testing content strategies.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommPerformance;
