import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Target, DollarSign, AlertTriangle, Shield,
  Trophy, Brain, Zap, Eye, ArrowUpRight, ArrowDownRight, ChevronRight,
  Clock, Users, Activity, PieChart, ArrowRight, Gauge, Percent,
  MapPin, Calendar, TrendingDown, Star
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface SalesTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  metrics: {
    label: string;
    value: string;
    change: number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  description: string;
}

interface DealData {
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  daysInStage: number;
  risk: 'low' | 'medium' | 'high';
}

const SalesToolsShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('pipeline');

  const tabs = [
    { id: 'pipeline', label: 'Pipeline Intelligence', icon: <BarChart3 size={18} /> },
    { id: 'risk', label: 'Deal Risk Monitor', icon: <AlertTriangle size={18} /> },
    { id: 'conversion', label: 'Smart Conversion', icon: <Target size={18} /> },
    { id: 'health', label: 'Pipeline Health', icon: <Activity size={18} /> },
    { id: 'analytics', label: 'Sales Cycle Analytics', icon: <Clock size={18} /> },
    { id: 'forecast', label: 'AI Sales Forecast', icon: <Brain size={18} /> },
  ];

  const salesTools: SalesTool[] = [
    {
      id: 'pipeline',
      name: 'Pipeline Intelligence',
      icon: <BarChart3 size={24} />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      description: 'Real-time pipeline health monitoring and deal velocity analysis',
      metrics: [
        { label: 'Pipeline Value', value: '$3.2M', change: 18.5, trend: 'up' },
        { label: 'Deal Velocity', value: '2.4/day', change: 12.3, trend: 'up' },
        { label: 'Avg Deal Size', value: '$45K', change: -5.2, trend: 'down' },
      ],
    },
    {
      id: 'risk',
      name: 'Deal Risk Monitor',
      icon: <AlertTriangle size={24} />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      description: 'Risk factor identification, deal slippage prediction, probability analysis',
      metrics: [
        { label: 'At-Risk Deals', value: '7', change: -23.1, trend: 'down' },
        { label: 'Risk Score', value: '32/100', change: 8.4, trend: 'up' },
        { label: 'Slippage Probability', value: '18%', change: -12.5, trend: 'down' },
      ],
    },
    {
      id: 'conversion',
      name: 'Smart Conversion Insights',
      icon: <Target size={24} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Conversion funnel analysis and A/B testing for optimization',
      metrics: [
        { label: 'Conversion Rate', value: '24.8%', change: 15.7, trend: 'up' },
        { label: 'Lead-to-MQL', value: '31.2%', change: 4.2, trend: 'up' },
        { label: 'MQL-to-Opportunity', value: '68%', change: 9.3, trend: 'up' },
      ],
    },
    {
      id: 'health',
      name: 'Pipeline Health Dashboard',
      icon: <Activity size={24} />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      description: 'Deal aging analysis and stage-specific performance metrics',
      metrics: [
        { label: 'Healthy Deals', value: '78%', change: 12.4, trend: 'up' },
        { label: 'Stalled Deals', value: '12', change: -33.3, trend: 'down' },
        { label: 'Avg Age', value: '14 days', change: -21.4, trend: 'down' },
      ],
    },
    {
      id: 'analytics',
      name: 'Sales Cycle Analytics',
      icon: <Clock size={24} />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: 'Average sales cycle length and stage duration tracking',
      metrics: [
        { label: 'Avg Cycle', value: '28 days', change: -18.6, trend: 'down' },
        { label: 'Longest Stage', value: 'Proposal', change: 0, trend: 'neutral' },
        { label: 'Fastest Close', value: '5 days', change: 0, trend: 'neutral' },
      ],
    },
    {
      id: 'forecast',
      name: 'AI Sales Forecast',
      icon: <Brain size={24} />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      description: 'Predictive forecasting with AI models and revenue projections',
      metrics: [
        { label: 'Q2 Forecast', value: '$1.8M', change: 22.4, trend: 'up' },
        { label: 'Confidence', value: '94%', change: 3.2, trend: 'up' },
        { label: 'Upside', value: '$340K', change: 15.8, trend: 'up' },
      ],
    },
  ];

  const deals: DealData[] = [
    { name: 'Enterprise Refresh', company: 'TechCorp Global', value: 245000, stage: 'Proposal', probability: 75, daysInStage: 8, risk: 'low' },
    { name: 'Platform Migration', company: 'Innovate Labs', value: 178000, stage: 'Discovery', probability: 60, daysInStage: 12, risk: 'medium' },
    { name: 'Security Upgrade', company: 'FinanceFirst', value: 89000, stage: 'Negotiation', probability: 85, daysInStage: 3, risk: 'low' },
    { name: 'Analytics Suite', company: 'DataDriven Inc', value: 156000, stage: 'Proposal', probability: 45, daysInStage: 15, risk: 'high' },
    { name: 'Cloud Integration', company: 'CloudSync', value: 320000, stage: 'Closing', probability: 92, daysInStage: 2, risk: 'low' },
  ];

  const pipelineStages = [
    { name: 'Lead', count: 124, value: 2400000, conversion: 100 },
    { name: 'Qualified', count: 78, value: 3100000, conversion: 62.9 },
    { name: 'Proposal', count: 34, value: 2800000, conversion: 43.6 },
    { name: 'Negotiation', count: 18, value: 2200000, conversion: 52.9 },
    { name: 'Closing', count: 12, value: 1900000, conversion: 66.7 },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-amber-400 bg-amber-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight size={14} className="text-green-400" />;
      case 'down': return <ArrowDownRight size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-900/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-semibold rounded-full mb-4">
              SALES INTELLIGENCE SUITE
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              AI-Powered Sales Tools
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ten intelligent tools to transform your sales process, from pipeline visibility to predictive forecasting.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Key Metrics Bar */}
        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
            {[
              { label: 'Win Rate', value: '68%', change: 8.2, icon: <Trophy size={20} /> },
              { label: 'Pipeline Value', value: '$4.2M', change: 15.3, icon: <DollarSign size={20} /> },
              { label: 'Avg Sales Cycle', value: '24 days', change: -12.5, icon: <Clock size={20} /> },
              { label: 'Forecast Accuracy', value: '94%', change: 3.8, icon: <Brain size={20} /> },
            ].map((metric, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-emerald-500/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-400">{metric.icon}</span>
                  <span className="flex items-center text-sm font-medium text-green-400">
                    {getTrendIcon(metric.change >= 0 ? 'up' : 'down')}
                    {Math.abs(metric.change)}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Tab Navigation */}
        <ScrollAnimationWrapper animation="fade-up" delay={200}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl flex items-center space-x-2 font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Main Content Grid */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Tool Detail Card */}
            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              {salesTools.filter(t => t.id === activeTab).map(tool => (
                <div key={tool.id}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <AnimatedFeatureIcon icon={tool.icon} color={tool.bgColor} size="lg" />
                      <div>
                        <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                        <p className="text-gray-400 text-sm">{tool.description}</p>
                      </div>
                    </div>
                    <button className="flex items-center px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all">
                      View Details <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {tool.metrics.map((metric, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">{metric.label}</span>
                          {getTrendIcon(metric.trend || 'neutral')}
                        </div>
                        <div className="text-2xl font-bold text-white">{metric.value}</div>
                        <div className={`text-xs mt-1 ${metric.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {metric.change >= 0 ? '+' : ''}{metric.change}% vs last month
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mini Chart / Visualization */}
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-300 font-medium">Performance Trend</span>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-400 flex items-center"><TrendingUp size={14} className="mr-1 text-green-400" /> This Month</span>
                        <span className="text-gray-400 flex items-center"><TrendingDown size={14} className="mr-1 text-gray-500" /> Last Month</span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between h-24 space-x-2">
                      {[65, 78, 82, 75, 88, 92, 85, 95].map((value, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center space-y-1">
                          <div className="w-full bg-emerald-500/30 rounded-t" style={{ height: `${value}%` }} />
                          <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${value * 0.85}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Deals Panel */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Eye size={18} className="mr-2 text-emerald-400" />
                  Live Deal Analysis
                </h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">Real-time</span>
              </div>

              <div className="space-y-3">
                {deals.map((deal, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(deal.risk)}`}>
                        {deal.risk} risk
                      </span>
                      <span className="text-xs text-gray-400">{deal.daysInStage}d in stage</span>
                    </div>
                    <p className="font-medium text-white text-sm mb-1">{deal.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{deal.company}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-400">${(deal.value / 1000).toFixed(0)}K</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${deal.probability >= 80 ? 'bg-green-500' : deal.probability >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-600/50 transition-all text-sm font-medium flex items-center justify-center">
                View All Deals <ArrowRight size={14} className="ml-2" />
              </button>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Pipeline Stages Visualization */}
        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Gauge size={18} className="mr-2 text-blue-400" />
                Pipeline Funnel Overview
              </h3>
              <span className="text-sm text-gray-400">Updated 2 min ago</span>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {pipelineStages.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-blue-500/30 transition-all">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-500/20 text-blue-400' :
                        index === pipelineStages.length - 1 ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        <Users size={18} />
                      </div>
                    </div>
                    <h4 className="text-white font-medium text-center mb-2">{stage.name}</h4>
                    <div className="text-center mb-2">
                      <span className="text-2xl font-bold text-white">{stage.count}</span>
                      <span className="text-gray-400 text-sm ml-1">deals</span>
                    </div>
                    <div className="text-center">
                      <span className="text-emerald-400 font-medium">${(stage.value / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                        style={{ width: `${stage.conversion}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">{stage.conversion}% conversion</p>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                      <ChevronRight size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Feature Grid */}
        <ScrollAnimationWrapper animation="fade-up" delay={500}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 max-w-6xl mx-auto">
            {[
              { icon: <BarChart3 size={18} />, label: 'Pipeline Analytics', color: 'emerald' },
              { icon: <TrendingUp size={18} />, label: 'Win Rate Intelligence', color: 'blue' },
              { icon: <AlertTriangle size={18} />, label: 'Deal Risk Monitor', color: 'amber' },
              { icon: <Eye size={18} />, label: 'Competitor Insights', color: 'purple' },
              { icon: <PieChart size={18} />, label: 'Revenue Intelligence', color: 'pink' },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3 flex items-center space-x-3 hover:border-emerald-500/30 transition-all group cursor-pointer"
              >
                <span className={`text-${feature.color}-400`}>{feature.icon}</span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{feature.label}</span>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default SalesToolsShowcase;