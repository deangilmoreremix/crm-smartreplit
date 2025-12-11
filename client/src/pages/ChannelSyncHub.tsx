
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDealStore } from '../store/dealStore';
import { BarChart3, Wifi, MessageSquare, Phone, Mail, Video, ArrowUpRight, Filter, Globe } from 'lucide-react';

const ChannelSyncHub: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState('last-30-days');

  // Calculate sync metrics
  const calculateSyncMetrics = () => {
    const totalChannels = 6;
    const syncedChannels = 5;
    const syncRate = (syncedChannels / totalChannels) * 100;
    
    return {
      totalChannels,
      syncedChannels,
      syncRate: Math.round(syncRate),
      lastSync: '2 minutes ago'
    };
  };

  const metrics = calculateSyncMetrics();

  const channelData = [
    { name: 'Email', status: 'synced', messages: 156, lastSync: '1 min ago', health: 98 },
    { name: 'Phone System', status: 'synced', messages: 42, lastSync: '2 min ago', health: 95 },
    { name: 'SMS', status: 'synced', messages: 89, lastSync: '1 min ago', health: 100 },
    { name: 'WhatsApp', status: 'synced', messages: 23, lastSync: '30 sec ago', health: 92 },
    { name: 'Video Calls', status: 'synced', messages: 18, lastSync: '5 min ago', health: 88 },
    { name: 'LinkedIn', status: 'error', messages: 0, lastSync: '2 hours ago', health: 0 }
  ];

  const syncInsights = [
    {
      title: 'Multi-Channel Coordination',
      insight: 'All active channels are synchronized in real-time',
      benefit: 'Unified customer journey tracking',
      priority: 'Operational'
    },
    {
      title: 'Channel Health Monitoring',
      insight: 'LinkedIn integration requires reconnection',
      benefit: 'Prevents missed communications',
      priority: 'Critical'
    },
    {
      title: 'Message Flow Optimization',
      insight: 'WhatsApp shows 40% higher engagement rates',
      benefit: 'Focus resources on high-performing channels',
      priority: 'Strategic'
    },
    {
      title: 'Cross-Channel Analytics',
      insight: 'Phone-to-email follow-up increases conversion by 35%',
      benefit: 'Optimize communication sequences',
      priority: 'Performance'
    }
  ];

  const recentSyncActivity = [
    { channel: 'Email', action: 'Message synchronized', time: '30 seconds ago', status: 'success' },
    { channel: 'SMS', action: 'Delivery status updated', time: '1 minute ago', status: 'success' },
    { channel: 'Phone', action: 'Call log synchronized', time: '2 minutes ago', status: 'success' },
    { channel: 'WhatsApp', action: 'Contact status synced', time: '3 minutes ago', status: 'success' },
    { channel: 'LinkedIn', action: 'Connection failed', time: '2 hours ago', status: 'error' }
  ];

  const timeframes = [
    { value: 'last-24-hours', label: 'Last 24 Hours' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-90-days', label: 'Last 90 Days' }
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return Mail;
      case 'phone system': case 'phone': return Phone;
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageSquare;
      case 'video calls': return Video;
      case 'linkedin': return Globe;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-500/20 text-green-500';
      case 'error': return 'bg-red-500/20 text-red-500';
      case 'warning': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/20 text-red-500';
      case 'Strategic': return 'bg-blue-500/20 text-blue-500';
      case 'Performance': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                <Wifi className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Channel Sync Hub
                </h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Multi-channel coordination and synchronization control
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {timeframes.map(timeframe => (
                  <option key={timeframe.value} value={timeframe.value}>
                    {timeframe.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sync Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: 'Total Channels', 
              value: metrics.totalChannels.toString(),
              icon: Globe,
              color: 'from-blue-500 to-cyan-500',
              change: '+1 new'
            },
            { 
              title: 'Synced Channels', 
              value: metrics.syncedChannels.toString(),
              icon: Wifi,
              color: 'from-green-500 to-emerald-500',
              change: '+0 errors'
            },
            { 
              title: 'Sync Rate', 
              value: `${metrics.syncRate}%`,
              icon: BarChart3,
              color: 'from-purple-500 to-pink-500',
              change: '+5% improved'
            },
            { 
              title: 'Last Sync', 
              value: metrics.lastSync,
              icon: MessageSquare,
              color: 'from-orange-500 to-red-500',
              change: 'Real-time'
            }
          ].map((metric, index) => (
            <div
              key={index}
              className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-green-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                {metric.value}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{metric.title}</p>
            </div>
          ))}
        </div>

        {/* Channel Status Grid */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            Channel Synchronization Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelData.map((channel, index) => {
              const IconComponent = getChannelIcon(channel.name);
              return (
                <div key={index} className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-5 w-5 ${channel.status === 'synced' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {channel.name}
                      </span>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(channel.status)}`}>
                      {channel.status}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Messages</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{channel.messages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Sync</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{channel.lastSync}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Health</span>
                      <span className={`text-sm font-medium ${channel.health > 90 ? 'text-green-500' : channel.health > 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {channel.health}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sync Insights */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            Channel Synchronization Insights
          </h2>
          
          <div className="space-y-4">
            {syncInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {insight.title}
                  </h3>
                  <div className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(insight.priority)}`}>
                    {insight.priority}
                  </div>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {insight.insight}
                </p>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  💡 {insight.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sync Activity */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            Recent Synchronization Activity
          </h2>
          
          <div className="space-y-3">
            {recentSyncActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  <Wifi className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {activity.channel}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.action} • {activity.time}
                  </p>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelSyncHub;
