import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import EmailDashboard from '../components/EmailDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useCommunicationStore } from '../store/communicationStore';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from '../components/GlassCard';
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
} from 'lucide-react';

export default function Communication() {
  const { isDark } = useTheme();
  const { emails, callLogs, communicationLogs, analytics } = useCommunicationStore();

  const [activeTab, setActiveTab] = useState('email');

  const recentCommunications = communicationLogs
    .slice(0, 10)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recentCalls = callLogs
    .slice(0, 5)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCommTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'text':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CallsList = () => (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Phone className="w-5 h-5" />
          Recent Calls
        </h3>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Log Call
        </Button>
      </div>
      {recentCalls.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Phone className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'opacity-50'}`} />
          <p>No calls logged yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentCalls.map((call) => (
            <div key={call.id} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'border border-gray-700' : 'border'}`}>
              <div
                className={`p-2 rounded-full ${
                  call.direction === 'outbound' ? (isDark ? 'bg-blue-900/50' : 'bg-blue-100') : (isDark ? 'bg-green-900/50' : 'bg-green-100')
                }`}
              >
                <Phone
                  className={`w-4 h-4 ${
                    call.direction === 'outbound' ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-green-400' : 'text-green-600')
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{call.phoneNumber}</span>
                  <Badge className={getStatusColor(call.status)}>{call.status}</Badge>
                  <Badge variant="outline">{call.direction}</Badge>
                </div>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s
                </p>
                {call.notes && <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{call.notes}</p>}
                <div className={`flex items-center gap-2 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span>{formatDate(call.timestamp)}</span>
                  {call.outcome && (
                    <Badge variant="outline" className="text-xs">
                      {call.outcome}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );

  const CommunicationLog = () => (
    <GlassCard className="p-6">
      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <MessageSquare className="w-5 h-5" />
        Communication Timeline
      </h3>
        {recentCommunications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No communications logged yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCommunications.map((comm) => (
              <div key={comm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    comm.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                  }`}
                >
                  {getCommTypeIcon(comm.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{comm.type}</span>
                    <Badge className={getStatusColor(comm.status)}>{comm.status}</Badge>
                    <Badge variant="outline">{comm.direction}</Badge>
                  </div>
                  {comm.subject && (
                    <h4 className="font-medium text-gray-900 mb-1">{comm.subject}</h4>
                  )}
                  <p className="text-sm text-gray-700 line-clamp-2">{comm.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{formatDate(comm.timestamp)}</span>
                    {comm.duration && <span>{comm.duration} min</span>}
                    {comm.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </GlassCard>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-4">
          <div className="flex flex-row items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Communications</h3>
            <MessageSquare className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {emails.length + callLogs.length + communicationLogs.length}
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Across all channels</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex flex-row items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This Week</h3>
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {
              communicationLogs.filter((c) => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(c.timestamp) > weekAgo;
              }).length
            }
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Communications this week</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex flex-row items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Response Rate</h3>
            <CheckCircle className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(analytics.replyRate * 100).toFixed(1)}%</div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Email response rate</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex flex-row items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Response Time</h3>
            <Clock className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2.3h</div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Average response time</p>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommunicationLog />
        <CallsList />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-600">Manage all your customer communications</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Communication
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email ({emails.length})
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Calls ({callLogs.length})
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Meetings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="email">
            <div data-testid="video-email">
              <EmailDashboard />
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div data-testid="voip-dialer">
              <CallsList />
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <GlassCard className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Meetings</h3>
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'opacity-50'}`} />
                <p>Meeting management coming soon</p>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
