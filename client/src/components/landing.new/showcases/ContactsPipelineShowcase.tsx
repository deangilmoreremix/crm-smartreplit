import React, { useState } from 'react';
import {
  Users, UserPlus, Search, Filter, Star, TrendingUp, Briefcase,
  DollarSign, AlertTriangle, CheckCircle, Clock, Target,
  MoreHorizontal, Mail, Phone, Building2, Tag, Sparkles,
  GitMerge, Database, BarChart3, Brain, Zap, Shield, ChevronRight
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
  enriched: boolean;
  tags: string[];
  lastActivity: string;
  avatar: string;
}

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
  health: 'healthy' | 'at-risk' | 'stalled';
  daysLeft: number;
  avatar: string;
}

const ContactsPipelineShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'contacts' | 'pipeline'>('contacts');
  const [contactFilter, setContactFilter] = useState<string>('all');

  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      company: 'Acme Corp',
      role: 'VP of Engineering',
      email: 'sarah.chen@acme.com',
      phone: '+1 (555) 123-4567',
      score: 95,
      status: 'hot',
      enriched: true,
      tags: ['Enterprise', 'Decision Maker', 'Tech'],
      lastActivity: '2 hours ago',
      avatar: 'SC'
    },
    {
      id: '2',
      name: 'Michael Torres',
      company: 'TechStart Inc',
      role: 'CTO',
      email: 'm.torres@techstart.io',
      phone: '+1 (555) 234-5678',
      score: 78,
      status: 'warm',
      enriched: true,
      tags: ['Startup', 'Early Adopter'],
      lastActivity: '1 day ago',
      avatar: 'MT'
    },
    {
      id: '3',
      name: 'Emily Johnson',
      company: 'Global Dynamics',
      role: 'Procurement Lead',
      email: 'emily.j@globaldyn.com',
      phone: '+1 (555) 345-6789',
      score: 62,
      status: 'warm',
      enriched: false,
      tags: ['Enterprise', 'Price Sensitive'],
      lastActivity: '3 days ago',
      avatar: 'EJ'
    },
    {
      id: '4',
      name: 'David Kim',
      company: 'Innovate Solutions',
      role: 'CEO',
      email: 'dkim@innovatesol.com',
      phone: '+1 (555) 456-7890',
      score: 88,
      status: 'hot',
      enriched: true,
      tags: ['Hot Lead', 'High Value'],
      lastActivity: '30 mins ago',
      avatar: 'DK'
    },
    {
      id: '5',
      name: 'Amanda Rodriguez',
      company: 'Nexus Labs',
      role: 'Product Manager',
      email: 'amanda.r@nexuslabs.co',
      phone: '+1 (555) 567-8901',
      score: 45,
      status: 'cold',
      enriched: false,
      tags: ['Mid-Market', 'Research'],
      lastActivity: '1 week ago',
      avatar: 'AR'
    }
  ];

  const pipelineStages = [
    { name: 'Lead', color: 'bg-blue-500', deals: 12 },
    { name: 'Qualified', color: 'bg-purple-500', deals: 8 },
    { name: 'Proposal', color: 'bg-amber-500', deals: 5 },
    { name: 'Negotiation', color: 'bg-orange-500', deals: 3 },
    { name: 'Closing', color: 'bg-green-500', deals: 2 }
  ];

  const deals: Deal[] = [
    { id: '1', title: 'Acme Corp Enterprise', company: 'Acme Corp', value: 125000, probability: 75, stage: 'Proposal', health: 'healthy', daysLeft: 12, avatar: 'AC' },
    { id: '2', title: 'TechStart Platform', company: 'TechStart Inc', value: 89000, probability: 50, stage: 'Negotiation', health: 'at-risk', daysLeft: 5, avatar: 'TS' },
    { id: '3', title: 'Global Dynamics Integration', company: 'Global Dynamics', value: 245000, probability: 30, stage: 'Qualified', health: 'healthy', daysLeft: 18, avatar: 'GD' },
    { id: '4', title: 'Innovate Solutions Setup', company: 'Innovate Solutions', value: 67000, probability: 90, stage: 'Closing', health: 'healthy', daysLeft: 2, avatar: 'IS' },
    { id: '5', title: 'Nexus Labs Pilot', company: 'Nexus Labs', value: 35000, probability: 20, stage: 'Lead', health: 'stalled', daysLeft: 8, avatar: 'NL' },
  ];

  const contactFeatures = [
    { icon: <Sparkles size={18} />, label: 'AI-Enhanced Profiles' },
    { icon: <Search size={18} />, label: 'Advanced Filtering' },
    { icon: <Users size={18} />, label: 'Bulk Operations' },
    { icon: <Target size={18} />, label: 'Lead Scoring' },
    { icon: <Database size={18} />, label: 'Custom Fields' },
    { icon: <Clock size={18} />, label: 'Activity History' },
    { icon: <GitMerge size={18} />, label: 'Duplicate Detection' },
    { icon: <Zap size={18} />, label: 'Data Enrichment' },
    { icon: <Tag size={18} />, label: 'Segmentation' },
  ];

  const pipelineFeatures = [
    { icon: <BarChart3 size={18} />, label: 'Visual Pipeline' },
    { icon: <TrendingUp size={18} />, label: 'Deal Stages' },
    { icon: <DollarSign size={18} />, label: 'Deal Analytics' },
    { icon: <Target size={18} />, label: 'Probability Tracking' },
    { icon: <AlertTriangle size={18} />, label: 'Risk Assessment' },
    { icon: <Brain size={18} />, label: 'Pipeline Intelligence' },
    { icon: <Zap size={18} />, label: 'Deal Insights' },
    { icon: <Shield size={18} />, label: 'Forecasting' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (score >= 60) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle size={16} className="text-green-600" />;
      case 'at-risk': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'stalled': return <Clock size={16} className="text-red-600" />;
      default: return null;
    }
  };

  const filteredContacts = contactFilter === 'all' 
    ? contacts 
    : contacts.filter(c => c.status === contactFilter);

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-indigo-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-full mb-4">
              <Users size={16} />
              CONTACTS & PIPELINE
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Manage Contacts & Close Deals Faster
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              AI-powered contact management with intelligent lead scoring, enrichment, and a visual pipeline 
              to help your team convert prospects into customers.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className="flex justify-center mb-8">
            <div className={`inline-flex p-1.5 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'} shadow-lg`}>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
                  activeTab === 'contacts'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users size={18} />
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
                  activeTab === 'pipeline'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase size={18} />
                Pipeline
              </button>
            </div>
          </div>
        </ScrollAnimationWrapper>

        {activeTab === 'contacts' ? (
          <ScrollAnimationWrapper animation="fade-up" delay={200}>
            <div className="max-w-6xl mx-auto">
              <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-200'} px-6 py-4 border-b flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <Users size={22} className="text-indigo-600" />
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Contact Management</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>{contacts.length} contacts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <Search size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                      <input 
                        type="text" 
                        placeholder="Search contacts..." 
                        className={`bg-transparent text-sm ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-500'} outline-none w-40`}
                      />
                    </div>
                    <button className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <Filter size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-md transition-all">
                      <UserPlus size={16} />
                      Add Contact
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    {['all', 'hot', 'warm', 'cold'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setContactFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          contactFilter === filter
                            ? 'bg-indigo-500 text-white'
                            : isDark
                              ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredContacts.map((contact, index) => {
                      const scoreColors = getScoreColor(contact.score);
                      return (
                        <ScrollAnimationWrapper key={contact.id} animation="fade-up" delay={index * 50}>
                          <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'} rounded-xl p-4 border hover:shadow-lg transition-all group`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {contact.avatar}
                                </div>
                                <div>
                                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.name}</h4>
                                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{contact.role}</p>
                                </div>
                              </div>
                              <button className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                                <MoreHorizontal size={16} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Building2 size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{contact.company}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-4 text-sm">
                              <Mail size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                              <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{contact.email}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {contact.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 3 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                  +{contact.tags.length - 3}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border} border`}>
                                  Score: {contact.score}
                                </span>
                                {contact.enriched && (
                                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                    <Sparkles size={12} />
                                    AI
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{contact.lastActivity}</span>
                            </div>
                          </div>
                        </ScrollAnimationWrapper>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Showing {filteredContacts.length} of {contacts.length} contacts
                    </p>
                    <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      View all contacts <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <ScrollAnimationWrapper animation="fade-up" delay={300}>
                <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-4xl mx-auto">
                  {contactFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-all`}
                    >
                      <span className="text-indigo-600">{feature.icon}</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </ScrollAnimationWrapper>
            </div>
          </ScrollAnimationWrapper>
        ) : (
          <ScrollAnimationWrapper animation="fade-up" delay={200}>
            <div className="max-w-6xl mx-auto">
              <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
                <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-200'} px-6 py-4 border-b flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <Briefcase size={22} className="text-indigo-600" />
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Overview</h3>
                    <div className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      <TrendingUp size={14} />
                      <span>$2.4M total</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Total Value</span>
                    </div>
                    <button className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    {pipelineStages.map((stage, index) => (
                      <div key={index} className={`min-w-[180px] p-3 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.name}</span>
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>{stage.deals}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {pipelineStages.map((stage, stageIndex) => (
                      <div key={stageIndex} className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.name}</span>
                        </div>
                        <div className="space-y-3">
                          {deals.filter(d => {
                            const stageOrder = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closing'];
                            return stageOrder.indexOf(d.stage) === stageIndex;
                          }).length === 0 && stageIndex === 0 && (
                            <>
                              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">AC</div>
                                  <div>
                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Acme Corp Integration</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Lead</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>$45,000</span>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>15 days</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">TS</div>
                                  <div>
                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>TechStart Pilot</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Startup</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>$12,000</span>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>8 days</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">NL</div>
                                  <div>
                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Nexus Labs Trial</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Mid-Market</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>$8,500</span>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>20 days</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          {deals.filter(d => {
                            const stageOrder = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closing'];
                            return stageOrder.indexOf(d.stage) === stageIndex;
                          }).map((deal) => (
                            <div key={deal.id} className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 border ${isDark ? 'border-slate-700' : 'border-gray-200'} hover:shadow-md transition-all`}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">{deal.avatar}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{deal.title}</p>
                                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{deal.company}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>${(deal.value / 1000).toFixed(0)}K</span>
                                <div className="flex items-center gap-1">
                                  {getHealthIcon(deal.health)}
                                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{deal.daysLeft}d</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" 
                                  style={{ width: `${deal.probability}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{deal.probability}%</span>
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>probability</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <ScrollAnimationWrapper animation="fade-up" delay={300}>
                <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-4xl mx-auto">
                  {pipelineFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border shadow-sm hover:shadow-md transition-all`}
                    >
                      <span className="text-indigo-600">{feature.icon}</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </ScrollAnimationWrapper>
            </div>
          </ScrollAnimationWrapper>
        )}

        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Sparkles className="text-amber-600" size={24} />
                </div>
                <div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Contact Enrichment</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Automatically enhance contact data</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Company information verified</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Social profiles linked</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Engagement score calculated</span>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <Brain className="text-violet-600" size={24} />
                </div>
                <div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Intelligence</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI-powered deal insights</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <TrendingUp size={18} className="text-blue-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>3 deals need immediate attention</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <Target size={18} className="text-blue-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>85% avg close probability</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <DollarSign size={18} className="text-blue-600" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>$890K forecast this quarter</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default ContactsPipelineShowcase;