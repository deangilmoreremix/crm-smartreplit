import React, { useState, useEffect } from 'react';
import {
  Brain, BarChart3, TrendingUp, Eye, Zap, Target, Clock, CheckCircle,
  AlertTriangle, DollarSign, Users, ArrowUpRight, ArrowDownRight,
  Settings, Play, RefreshCw, ChevronRight, ExternalLink, Bell,
  Activity, TrendingDown, Gauge, Calendar
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface KPICard {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend: 'up' | 'down' | 'neutral';
}

interface ChartData {
  label: string;
  value: number;
}

const DashboardAnalyticsShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [isLive, setIsLive] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);

  const timeframes = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: 'ytd', label: 'YTD' },
  ];

  const kpiCards: KPICard[] = [
    { id: 'pipeline', label: 'Pipeline Value', value: 2.4, prefix: '$', suffix: 'M', change: 12.5, icon: <DollarSign size={20} />, color: 'text-green-600', bgColor: 'bg-green-100', trend: 'up' },
    { id: 'deals', label: 'Active Deals', value: 147, change: 8.2, icon: <Target size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100', trend: 'up' },
    { id: 'winrate', label: 'Win Rate', value: 68, suffix: '%', change: 5.1, icon: <TrendingUp size={20} />, color: 'text-emerald-600', bgColor: 'bg-emerald-100', trend: 'up' },
    { id: 'cycle', label: 'Avg Cycle', value: 24, suffix: ' days', change: -15.3, icon: <Clock size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-100', trend: 'down' },
    { id: 'ai-efficiency', label: 'AI Efficiency', value: 94, suffix: '%', change: 12.8, icon: <Brain size={20} />, color: 'text-violet-600', bgColor: 'bg-violet-100', trend: 'up' },
    { id: 'risk', label: 'Risk Flags', value: 3, change: -25.0, icon: <AlertTriangle size={20} />, color: 'text-amber-600', bgColor: 'bg-amber-100', trend: 'down' },
  ];

  const pipelineChartData: ChartData[] = [
    { label: 'Week 1', value: 45 },
    { label: 'Week 2', value: 52 },
    { label: 'Week 3', value: 48 },
    { label: 'Week 4', value: 61 },
    { label: 'Week 5', value: 55 },
    { label: 'Week 6', value: 72 },
  ];

  const maxChartValue = Math.max(...pipelineChartData.map(d => d.value));

  const recentActivity = [
    { id: 1, text: 'Acme Corp moved to Proposal', time: '2m ago', type: 'deal' },
    { id: 2, text: 'AI scored 5 new leads', time: '5m ago', type: 'ai' },
    { id: 3, text: 'TechStart deal closed', time: '12m ago', type: 'deal' },
    { id: 4, text: 'Risk alert: Global Dynamics', time: '18m ago', type: 'alert' },
  ];

  const aiRecommendations = [
    { id: 1, text: 'Prioritize Acme Corp - 89% close probability', impact: 'high', icon: <Target size={16} /> },
    { id: 2, text: 'Optimize outreach timing for EMEA leads', impact: 'medium', icon: <Clock size={16} /> },
    { id: 3, text: 'Consider expedited cycle for TechStart', impact: 'high', icon: <Zap size={16} /> },
  ];

  const connectedApps = [
    { name: 'Salesforce', status: 'connected', lastSync: '2 min ago' },
    { name: 'Slack', status: 'connected', lastSync: '5 min ago' },
    { name: 'HubSpot', status: 'syncing', lastSync: 'syncing...' },
    { name: 'Google Workspace', status: 'connected', lastSync: '1 min ago' },
  ];

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setNotificationCount(prev => prev > 0 ? prev - 1 : 3);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-full mb-4">
              {isLive && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>}
              LIVE ANALYTICS
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Dashboard & Analytics
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              AI-powered insights, real-time KPIs, and customizable dashboards to keep your sales team ahead of the curve.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Main Dashboard Preview */}
        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden max-w-6xl mx-auto mb-8`}>
            {/* Dashboard Header */}
            <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-gray-200'} px-6 py-4 border-b flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Brain size={24} className="text-emerald-600" />
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sales Command Center</h3>
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  <Activity size={14} />
                  <span>Live Updates</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${timeframe === tf.id ? 'bg-white text-gray-900 shadow-sm' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
                <button className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                  <RefreshCw size={18} className={isLive ? 'animate-spin text-emerald-600' : ''} />
                </button>
                <button className={`p-2 rounded-lg relative ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                  <Bell size={18} />
                  {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>}
                </button>
                <button className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {kpiCards.map((kpi, index) => (
                  <ScrollAnimationWrapper key={kpi.id} animation="fade-up" delay={index * 50}>
                    <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'} rounded-xl p-4 border hover:shadow-lg transition-all group`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                          <span className={kpi.color}>{kpi.icon}</span>
                        </div>
                        <div className={`flex items-center text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                          {kpi.trend === 'up' ? <ArrowUpRight size={12} /> : kpi.trend === 'down' ? <ArrowDownRight size={12} /> : null}
                          {Math.abs(kpi.change)}%
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kpi.prefix || ''}{kpi.value}{kpi.suffix || ''}
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.label}</div>
                    </div>
                  </ScrollAnimationWrapper>
                ))}
              </div>

              {/* Charts and Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pipeline Chart */}
                <div className={`lg:col-span-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'} rounded-xl p-5 border`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Overview</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>vs prev period</span>
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <TrendingUp size={12} className="mr-1" />
                        +18.2%
                      </span>
                    </div>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-2">
                    {pipelineChartData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-teal-500" style={{ height: `${(data.value / maxChartValue) * 100}%`, minHeight: '8px' }}></div>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-violet-50 to-white border-violet-100'} rounded-xl p-5 border`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain size={18} className="text-violet-600" />
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Recommendations</h4>
                  </div>
                  <div className="space-y-3">
                    {aiRecommendations.map((rec) => (
                      <div key={rec.id} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                        <div className={`p-1.5 rounded-lg ${rec.impact === 'high' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {rec.icon}
                        </div>
                        <p className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{rec.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Activity & Apps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Recent Activity */}
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'} rounded-xl p-5 border`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h4>
                    <button className={`text-xs font-medium text-blue-600 hover:text-blue-700 ${isDark ? 'text-blue-400' : ''}`}>View All</button>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${activity.type === 'deal' ? 'bg-blue-500' : activity.type === 'ai' ? 'bg-violet-500' : 'bg-amber-500'}`}></div>
                        <p className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{activity.text}</p>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Apps */}
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-amber-50 to-white border-amber-100'} rounded-xl p-5 border`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected Apps</h4>
                    <button className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                      <Settings size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {connectedApps.map((app) => (
                      <div key={app.name} className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                        <div className={`w-2 h-2 rounded-full ${app.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{app.name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{app.lastSync}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Embed Demo Section */}
        <ScrollAnimationWrapper animation="fade-up" delay={200}>
          <div className="max-w-6xl mx-auto">
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-200'} px-6 py-4 border-b flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Gauge size={22} className="text-indigo-600" />
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Embed Demo</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>NEW</span>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  <ExternalLink size={14} />
                  Get Embed Code
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Embed Preview */}
                  <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-100 border-gray-200'} rounded-xl p-4 border-2 border-dashed`}>
                    <div className="bg-white rounded-lg shadow-md p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain size={16} className="text-emerald-600" />
                          <span className="text-sm font-semibold text-gray-700">Live KPI</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-xs text-gray-500">Live</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">$2.4M</div>
                          <div className="text-xs text-gray-500">Pipeline</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">147</div>
                          <div className="text-xs text-gray-500">Deals</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-emerald-600">+12.5%</div>
                          <div className="text-xs text-gray-500">Growth</div>
                        </div>
                      </div>
                      <div className="h-16 flex items-end justify-between gap-1 px-2">
                        {[40, 55, 45, 60, 52, 70, 65, 80].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-emerald-400 to-emerald-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Embed Features */}
                  <div className="space-y-4">
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Embeddable Dashboard Features</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { icon: <BarChart3 size={16} />, title: 'Real-time KPI Display', desc: 'Live metrics updates for external websites' },
                        { icon: <Zap size={16} />, title: 'Lightweight Embed Code', desc: 'Simple iframe integration with minimal overhead' },
                        { icon: <Eye size={16} />, title: 'Customizable Metrics', desc: 'Select which KPIs to display' },
                        { icon: <RefreshCw size={16} />, title: 'Auto-refresh Data', desc: 'Real-time sync with your CRM data' },
                      ].map((feature, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'} border`}>
                          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                            {feature.icon}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                        <Play size={16} />
                        Try Demo
                      </button>
                      <button className={`px-4 py-3 font-medium rounded-xl border ${isDark ? 'border-slate-600 text-gray-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                        View Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Feature Pills */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="flex flex-wrap justify-center gap-3 mt-12 max-w-4xl mx-auto">
            {[
              { icon: <Brain size={16} />, label: 'AI Pipeline Intelligence' },
              { icon: <BarChart3 size={16} />, label: 'KPI Tracking' },
              { icon: <TrendingUp size={16} />, label: 'AI Performance Metrics' },
              { icon: <Eye size={16} />, label: 'Connected Apps' },
              { icon: <Zap size={16} />, label: 'Quick Actions' },
              { icon: <Clock size={16} />, label: 'Real-time Updates' },
              { icon: <Calendar size={16} />, label: 'Customizable Timeframes' },
              { icon: <Target size={16} />, label: 'AI Recommendations' },
              { icon: <Gauge size={16} />, label: 'Dashboard Embed' },
              { icon: <Activity size={16} />, label: 'Live Embed Metrics' },
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-all`}
              >
                <span className="text-emerald-600">{feature.icon}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default DashboardAnalyticsShowcase;