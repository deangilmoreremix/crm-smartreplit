import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Target, DollarSign, Users, Workflow, AlertTriangle,
  CheckCircle, Clock, ArrowUpRight, ArrowDownRight, ChevronRight, Play,
  Brain, Eye, Zap, PieChart, Award, Shield
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface SalesMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface Deal {
  name: string;
  value: number;
  stage: string;
  health: 'healthy' | 'at-risk' | 'stalled';
  daysLeft: number;
}

const SalesIntelligenceShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedView, setSelectedView] = useState<string>('pipeline');

  const metrics: SalesMetric[] = [
    { label: 'Pipeline Value', value: '$2.4M', change: 12.5, icon: <DollarSign size={20} />, color: 'text-green-600' },
    { label: 'Win Rate', value: '68%', change: 8.2, icon: <Target size={20} />, color: 'text-blue-600' },
    { label: 'Avg Cycle', value: '24 days', change: -15.3, icon: <Clock size={20} />, color: 'text-purple-600' },
    { label: 'Forecast', value: '$890K', change: 22.1, icon: <TrendingUp size={20} />, color: 'text-emerald-600' },
  ];

  const deals: Deal[] = [
    { name: 'Acme Corp Enterprise', value: 125000, stage: 'Proposal', health: 'healthy', daysLeft: 12 },
    { name: 'TechStart Solutions', value: 89000, stage: 'Negotiation', health: 'at-risk', daysLeft: 5 },
    { name: 'Global Dynamics', value: 245000, stage: 'Discovery', health: 'healthy', daysLeft: 18 },
    { name: 'Innovate Inc', value: 67000, stage: 'Closing', health: 'stalled', daysLeft: 2 },
  ];

  const views = [
    { id: 'pipeline', label: 'Pipeline View', icon: <Workflow size={18} /> },
    { id: 'forecasting', label: 'AI Forecasting', icon: <Brain size={18} /> },
    { id: 'risk', label: 'Deal Risk Monitor', icon: <AlertTriangle size={18} /> },
    { id: 'performance', label: 'Win Rate Analysis', icon: <Award size={18} /> },
  ];

  const healthColor = {
    healthy: 'bg-green-100 text-green-700 border-green-200',
    'at-risk': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    stalled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-indigo-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-full mb-4">
              SALES INTELLIGENCE
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              AI-Powered Sales Intelligence
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Real-time pipeline analytics, predictive forecasting, and deal risk assessment 
              to help your team close more deals faster.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Stats bar */}
        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl p-4 border shadow-lg`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={metric.color}>{metric.icon}</span>
                  <span className={`flex items-center text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(metric.change)}%
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{metric.value}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{metric.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* View tabs */}
        <ScrollAnimationWrapper animation="fade-up" delay={200}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`px-4 py-3 rounded-xl flex items-center space-x-2 font-medium transition-all ${
                  selectedView === view.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {view.icon}
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Main content */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Pipeline view */}
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Live Pipeline
              </h3>
              <div className="space-y-4">
                {deals.map((deal, index) => (
                  <div
                    key={index}
                    className={`${isDark ? 'bg-slate-900' : 'bg-gray-50'} rounded-xl p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${healthColor[deal.health]}`}>
                        {deal.health === 'healthy' ? <CheckCircle size={20} /> : 
                         deal.health === 'at-risk' ? <AlertTriangle size={20} /> : 
                         <Clock size={20} />}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{deal.stage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${(deal.value / 1000).toFixed(0)}K</p>
                      <p className={`text-sm ${deal.daysLeft <= 3 ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deal.daysLeft} days left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Insights & Recommendations
              </h3>
              <div className="space-y-4">
                <div className={`flex items-start space-x-3 p-4 ${isDark ? 'bg-green-900/20 border-green-900' : 'bg-green-50 border-green-100'} rounded-xl border`}>
                  <Brain className="text-green-600 mt-1" size={20} />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>Focus on Enterprise deals</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Acme Corp and Global Dynamics have 85% close probability</p>
                  </div>
                </div>
                <div className={`flex items-start space-x-3 p-4 ${isDark ? 'bg-yellow-900/20 border-yellow-900' : 'bg-yellow-50 border-yellow-100'} rounded-xl border`}>
                  <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>Innovate Inc at risk</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No activity in 5 days. Consider priority follow-up.</p>
                  </div>
                </div>
                <div className={`flex items-start space-x-3 p-4 ${isDark ? 'bg-blue-900/20 border-blue-900' : 'bg-blue-50 border-blue-100'} rounded-xl border`}>
                  <TrendingUp className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Q4 Forecast上调12%</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Based on current pipeline and seasonal patterns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* Feature list */}
        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-5xl mx-auto">
            {[
              { icon: <BarChart3 size={18} />, label: 'Pipeline Analytics' },
              { icon: <Brain size={18} />, label: 'AI Forecasting' },
              { icon: <AlertTriangle size={18} />, label: 'Deal Risk Monitor' },
              { icon: <Target size={18} />, label: 'Win Rate Analysis' },
              { icon: <Eye size={18} />, label: 'Competitor Insights' },
              { icon: <PieChart size={18} />, label: 'Revenue Intelligence' },
              { icon: <Shield size={18} />, label: 'Risk Mitigation' },
              { icon: <Zap size={18} />, label: 'Deal Acceleration' },
            ].map((item, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl px-4 py-3 border`}
              >
                <span className="text-blue-600">{item.icon}</span>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default SalesIntelligenceShowcase;