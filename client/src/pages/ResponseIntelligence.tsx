
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Timer,
  MessageCircle,
  Target,
  Activity
} from 'lucide-react';

const ResponseIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate response metrics
  const avgResponseTime = 2.4; // hours
  const fastResponses = 45; // < 1 hour
  const slowResponses = 12; // > 24 hours
  const responseRate = 78; // percentage

  // Get contacts with response data
  const topContacts = Object.values(contacts).slice(0, 6);

  // Format time
  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get response level
  const getResponseLevel = (hours: number) => {
    if (hours < 1) return 'fast';
    if (hours < 4) return 'good';
    if (hours < 24) return 'slow';
    return 'very-slow';
  };

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Response Intelligence
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Response time analytics and communication efficiency insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Real-time Analytics
            </Badge>
          </div>
        </div>

        {/* Response Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Response Time
              </CardTitle>
              <Timer className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(avgResponseTime)}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                15% faster this week
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Fast Responses
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fastResponses}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Under 1 hour
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Slow Responses
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {slowResponses}
              </div>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Over 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Response Rate
              </CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {responseRate}%
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Above target
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Optimization */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Response Time Optimization Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Excellent Quick Response Rate
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {fastResponses} responses under 1 hour. Keep up the great momentum with instant notifications.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Opportunity: Reduce Slow Responses
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {slowResponses} responses took over 24 hours. Set up automated follow-up reminders to improve this.
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Peak Response Times
                  </h4>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Best response times: 9-11 AM and 2-4 PM. Schedule important communications during these windows.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Performance by Contact */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
              Response Performance by Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topContacts.map((contact) => {
              const responseTime = Math.random() * 48; // Mock response time
              const responseLevel = getResponseLevel(responseTime);
              
              return (
                <div key={contact.id} className={`flex items-center space-x-3 p-4 rounded-lg border ${
                  responseLevel === 'fast' ? 
                    (isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200') :
                  responseLevel === 'good' ?
                    (isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200') :
                  responseLevel === 'slow' ?
                    (isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200') :
                    (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
                }`}>
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
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${
                        responseLevel === 'fast' ? 'bg-green-50 text-green-700 border-green-200' :
                        responseLevel === 'good' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        responseLevel === 'slow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        Avg: {formatTime(responseTime)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                        {Math.floor(Math.random() * 10) + 5} responses
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {responseLevel === 'fast' ? <CheckCircle className="h-5 w-5 text-green-500 mb-1" /> :
                     responseLevel === 'good' ? <Clock className="h-5 w-5 text-blue-500 mb-1" /> :
                     responseLevel === 'slow' ? <Timer className="h-5 w-5 text-yellow-500 mb-1" /> :
                     <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />}
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {responseLevel === 'fast' ? 'Fast' :
                       responseLevel === 'good' ? 'Good' :
                       responseLevel === 'slow' ? 'Slow' : 'Very Slow'}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Response Activity */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-purple-500" />
              Recent Response Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { contact: 'Jane Doe', time: '15 minutes', type: 'email', status: 'fast' },
              { contact: 'Darlene Robertson', time: '2.5 hours', type: 'call', status: 'good' },
              { contact: 'Wade Warren', time: '8 hours', type: 'sms', status: 'slow' },
              { contact: 'Kathryn Murphy', time: '30 minutes', type: 'email', status: 'fast' },
              { contact: 'Jerome Bell', time: '1 day', type: 'call', status: 'very-slow' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Avatar
                  size="sm"
                  fallback={getInitials(activity.contact)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activity.contact}
                  </p>
                  <p className={`text-sm truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Responded in {activity.time} • {activity.type}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    activity.status === 'fast' ? 'bg-green-50 text-green-700 border-green-200' :
                    activity.status === 'good' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    activity.status === 'slow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {activity.status === 'fast' ? 'Fast' :
                   activity.status === 'good' ? 'Good' :
                   activity.status === 'slow' ? 'Slow' : 'Very Slow'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponseIntelligence;
