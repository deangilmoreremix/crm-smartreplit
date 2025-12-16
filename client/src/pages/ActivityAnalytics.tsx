
import React from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import Avatar from '../components/ui/Avatar';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Phone,
  Mail,
  Activity,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const ActivityAnalytics: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Calculate communication metrics
  const dealsArray = Object.values(deals);
  const totalCommunications = 156;
  const emailsSent = 89;
  const callsMade = 42;
  const avgResponseTime = 2.4; // hours

  // Get top communicating contacts
  const topContacts = Object.values(contacts).slice(0, 6);

  // Format time
  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <PageLayout
      title="Activity Analytics"
      description="Communication frequency analysis and engagement insights"
      actions={
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Activity className="h-3 w-3 mr-1" />
          Live Analytics
        </Badge>
      }
    >
      <div className="space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Communications
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalCommunications}
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +18% from last week
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Emails Sent
              </CardTitle>
              <Mail className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {emailsSent}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% open rate
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Calls Made
              </CardTitle>
              <Phone className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {callsMade}
              </div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                85% connection rate
              </p>
            </CardContent>
          </Card>

          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(avgResponseTime)}
              </div>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -15% faster
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Communication Channels Analysis */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Communication Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { channel: 'Email', count: 89, rate: '24%', color: 'bg-blue-100 text-blue-600' },
                { channel: 'Phone', count: 42, rate: '85%', color: 'bg-green-100 text-green-600' },
                { channel: 'SMS', count: 18, rate: '92%', color: 'bg-purple-100 text-purple-600' },
                { channel: 'WhatsApp', count: 5, rate: '100%', color: 'bg-green-100 text-green-600' },
                { channel: 'LinkedIn', count: 2, rate: '50%', color: 'bg-blue-100 text-blue-600' }
              ].map((channel, index) => (
                <div 
                  key={channel.channel}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                >
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    {channel.channel}
                  </div>
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {channel.count} sent
                  </div>
                  <div className={`text-sm px-2 py-1 rounded-full ${channel.color}`}>
                    {channel.rate} response
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Communicating Contacts */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="h-5 w-5 mr-2 text-green-500" />
              Most Active Communications
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
                        {Math.floor(Math.random() * 15) + 5} communications
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Communication Activity */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="h-5 w-5 mr-2 text-orange-500" />
              Recent Communication Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: 'email', contact: 'Jane Doe', time: '2 hours ago', status: 'opened' },
              { type: 'call', contact: 'Darlene Robertson', time: '4 hours ago', status: 'completed' },
              { type: 'sms', contact: 'Wade Warren', time: '6 hours ago', status: 'delivered' },
              { type: 'email', contact: 'Kathryn Murphy', time: '1 day ago', status: 'replied' },
              { type: 'call', contact: 'Jerome Bell', time: '2 days ago', status: 'missed' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'email' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'call' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {activity.type === 'email' ? <Mail className="h-4 w-4" /> :
                   activity.type === 'call' ? <Phone className="h-4 w-4" /> :
                   <MessageSquare className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activity.contact}
                  </p>
                  <p className={`text-sm truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {activity.type} • {activity.time}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    activity.status === 'opened' || activity.status === 'completed' || activity.status === 'replied' 
                      ? 'bg-green-50 text-green-700 border-green-200' :
                    activity.status === 'delivered' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-orange-50 text-orange-700 border-orange-200'
                  }`}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        </div>
      </PageLayout>
    );
  };

export default ActivityAnalytics;
