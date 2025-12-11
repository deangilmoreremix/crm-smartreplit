import React, { useState } from 'react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../store/contactStore';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import {
  DollarSign,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart as PieChartIcon,
  ZapOff
} from 'lucide-react';
import Avatar from './ui/Avatar';
import { getInitials } from '../utils/avatars';

interface KPIMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  relatedContacts?: Array<{ id: string; name: string; avatar?: string; }>;
}

interface PipelineStage {
  name: string;
  value: number;
  deals: number;
  color: string;
}

const DealAnalytics: React.FC = () => {
  const { deals, getStageValues } = useDealStore();
  const { contacts } = useContactStore();
  const { isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Get stage values by calling the getter function
  const stageValues = getStageValues();

  // Render avatar stack
  const renderAvatarStack = (contacts: Array<{ id: string; name: string; avatar?: string }>, maxVisible: number = 3) => {
    const visibleContacts = contacts.slice(0, maxVisible);
    const remainingCount = Math.max(0, contacts.length - maxVisible);
    
    return (
      <div className="flex items-center mt-2">
        <div className="flex -space-x-2">
          {visibleContacts.map((contact, index) => (
            <div key={contact.id} className="relative" style={{ zIndex: maxVisible - index }}>
              <Avatar
                src={contact.avatar}
                alt={contact.name}
                size="sm"
                fallback={getInitials(contact.name)}
                className="border-2 border-white dark:border-gray-900"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-900 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate KPI metrics
  const calculateKPIs = (): KPIMetric[] => {
    const dealsArray = deals ? Object.values(deals) : [];
    const totalRevenue = dealsArray
      .filter(deal => deal.stage === 'closed-won')
      .reduce((sum, deal) => sum + deal.value, 0);
    const totalDeals = dealsArray.length;
    const wonDeals = dealsArray.filter(deal => deal.stage === 'closed-won').length;
    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const totalContacts = Object.keys(contacts).length || 0;
    const avgDealSize = wonDeals > 0 ? totalRevenue / wonDeals : 0;

    // Get representative contacts
    const representativeContacts = Object.values(contacts).slice(0, 5).map(contact => ({
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar
    }));

    // Get contacts associated with won deals
    const wonDealContacts = dealsArray
      .filter(deal => deal.stage === 'closed-won')
      .map(deal => {
        const contact = contacts[deal.contactId];
        return contact ? {
          id: contact.id,
          name: contact.name,
          avatar: contact.avatar
        } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;

    // Get contacts associated with high-value deals
    const highValueDealContacts = dealsArray
      .filter(deal => deal.value > 50000)
      .map(deal => {
        const contact = contacts[deal.contactId];
        return contact ? {
          id: contact.id,
          name: contact.name,
          avatar: contact.avatar
        } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;

    return [
      {
        title: 'Total Revenue',
        value: `$${(totalRevenue / 1000).toFixed(1)}k`,
        change: 12.5,
        changeType: 'increase',
        icon: DollarSign,
        description: 'Revenue from closed deals',
        relatedContacts: wonDealContacts
      },
      {
        title: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: 8.2,
        changeType: 'increase',
        icon: Target,
        description: 'Deals won vs total deals',
        relatedContacts: wonDealContacts
      },
      {
        title: 'Total Contacts',
        value: totalContacts.toString(),
        change: 15.3,
        changeType: 'increase',
        icon: Users,
        description: 'Active contacts in pipeline',
        relatedContacts: representativeContacts
      },
      {
        title: 'Avg Deal Size',
        value: `$${(avgDealSize / 1000).toFixed(1)}k`,
        change: -2.1,
        changeType: 'decrease',
        icon: TrendingUp,
        description: 'Average revenue per deal',
        relatedContacts: highValueDealContacts
      }
    ];
  };

  // Calculate deal counts by stage
  const calculateDealCounts = () => {
    const dealsArray = Object.values(deals);
    return {
      qualification: dealsArray.filter(deal => deal.stage === 'qualification').length,
      proposal: dealsArray.filter(deal => deal.stage === 'proposal').length,
      negotiation: dealsArray.filter(deal => deal.stage === 'negotiation').length,
      'closed-won': dealsArray.filter(deal => deal.stage === 'closed-won').length,
      'closed-lost': dealsArray.filter(deal => deal.stage === 'closed-lost').length
    };
  };

  // Calculate values by status with representative contacts
  const calculateValuesByStatus = () => {
    const dealsArray = Object.values(deals);
    
    // Get active deals with contacts
    const activeDealsWithContacts = dealsArray
      .filter(deal => deal.stage !== 'closed-won' && deal.stage !== 'closed-lost')
      .map(deal => ({
        ...deal,
        contact: contacts[deal.contactId]
      }))
      .filter(deal => deal.contact)
      .slice(0, 5);
    
    // Get won deals with contacts
    const wonDealsWithContacts = dealsArray
      .filter(deal => deal.stage === 'closed-won')
      .map(deal => ({
        ...deal,
        contact: contacts[deal.contactId]
      }))
      .filter(deal => deal.contact)
      .slice(0, 5);
    
    // Get lost deals with contacts
    const lostDealsWithContacts = dealsArray
      .filter(deal => deal.stage === 'closed-lost')
      .map(deal => ({
        ...deal,
        contact: contacts[deal.contactId]
      }))
      .filter(deal => deal.contact)
      .slice(0, 5);
    
    return {
      active: dealsArray
        .filter(deal => deal.stage !== 'closed-won' && deal.stage !== 'closed-lost')
        .reduce((sum, deal) => sum + deal.value, 0),
      won: dealsArray
        .filter(deal => deal.stage === 'closed-won')
        .reduce((sum, deal) => sum + deal.value, 0),
      lost: dealsArray
        .filter(deal => deal.stage === 'closed-lost')
        .reduce((sum, deal) => sum + deal.value, 0),
      activeDealsWithContacts,
      wonDealsWithContacts,
      lostDealsWithContacts
    };
  };

  // Generate trend data
  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const totalValue = Object.values(deals).reduce((sum, deal) => sum + deal.value, 0);
    
    return months.map((month, index) => ({
      month,
      revenue: Math.floor(totalValue * (0.7 + Math.random() * 0.6) / 6),
      deals: Math.floor(Object.keys(deals).length * (0.8 + Math.random() * 0.4) / 6),
      pipeline: Math.floor(valuesByStatus.active * (0.6 + Math.random() * 0.8) / 6)
    }));
  };

  // Calculate conversion rates
  const calculateConversionRate = (fromStage: string, toStage: string) => {
    const dealCounts = calculateDealCounts();
    const fromCount = dealCounts[fromStage as keyof typeof dealCounts];
    const toCount = dealCounts[toStage as keyof typeof dealCounts];
    
    return fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
  };

  const kpiMetrics = calculateKPIs();
  const dealCounts = calculateDealCounts();
  const valuesByStatus = calculateValuesByStatus();
  const trendData = generateTrendData();

  // Pipeline stage data with colors
  const pipelineStageData: PipelineStage[] = [
    {
      name: 'Qualification',
      value: stageValues.qualification || 0,
      deals: dealCounts.qualification,
      color: '#3B82F6'
    },
    {
      name: 'Proposal',
      value: stageValues.proposal || 0,
      deals: dealCounts.proposal,
      color: '#8B5CF6'
    },
    {
      name: 'Negotiation',
      value: stageValues.negotiation || 0,
      deals: dealCounts.negotiation,
      color: '#F59E0B'
    },
    {
      name: 'Won',
      value: stageValues['closed-won'] || 0,
      deals: dealCounts['closed-won'],
      color: '#10B981'
    },
    {
      name: 'Lost',
      value: stageValues['closed-lost'] || 0,
      deals: dealCounts['closed-lost'],
      color: '#EF4444'
    }
  ];

  // Convert to array format for bar charts
  const stageData = Object.entries(dealCounts).map(([stage, count]) => ({
    stage: stage === 'closed-won' ? 'Won' : 
           stage === 'closed-lost' ? 'Lost' :
           stage === 'qualification' ? 'Qualified' : 
           stage === 'proposal' ? 'Proposed' : 'Negotiating',
    count
  }));

  // Calculate monthly pipeline value
  const pipelineByMonth: Record<string, number> = {};
  Object.values(deals).forEach(deal => {
    if (deal.stage !== 'closed-won' && deal.stage !== 'closed-lost') {
      const month = deal.dueDate ? 
        `${deal.dueDate.getFullYear()}-${String(deal.dueDate.getMonth() + 1).padStart(2, '0')}` : 
        'No date';
        
      pipelineByMonth[month] = (pipelineByMonth[month] || 0) + deal.value;
    }
  });

  const monthlyData = Object.entries(pipelineByMonth)
    .sort()
    .map(([month, value]) => ({
      month: month === 'No date' ? month : month.split('-')[1],
      value
    }));

  const conversionRates = {
    qualToProposal: calculateConversionRate('qualification', 'proposal'),
    proposalToNegotiation: calculateConversionRate('proposal', 'negotiation'),
    negotiationToWon: calculateConversionRate('negotiation', 'closed-won')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Deal Analytics</h2>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedPeriod === period 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : `${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((metric, index) => (
          <div key={index} className={`relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className={`text-xs px-2 py-1 rounded-full ${
                metric.changeType === 'increase' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}>
                {metric.changeType === 'increase' ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{metric.value}</p>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{metric.title}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{metric.description}</p>
              
              {/* Avatar stack for related contacts */}
              {metric.relatedContacts && metric.relatedContacts.length > 0 && (
                renderAvatarStack(metric.relatedContacts)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards with Gradients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${isDark ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'} border rounded-lg p-4`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Active Pipeline</p>
              <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>${Math.round(valuesByStatus.active / 1000)}k</p>
            </div>
            <div className={`p-2 rounded-full ${isDark ? 'bg-blue-500/30' : 'bg-blue-200/50'}`}>
              <Activity className={`h-5 w-5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`} />
            </div>
          </div>
          
          {/* Avatar stack for active deals */}
          {valuesByStatus.activeDealsWithContacts && valuesByStatus.activeDealsWithContacts.length > 0 && (
            renderAvatarStack(valuesByStatus.activeDealsWithContacts.map(deal => deal.contact))
          )}
        </div>
        
        <div className={`${isDark ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30' : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'} border rounded-lg p-4`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>Won Deals (YTD)</p>
              <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>${Math.round(valuesByStatus.won / 1000)}k</p>
            </div>
            <div className={`p-2 rounded-full ${isDark ? 'bg-green-500/30' : 'bg-green-200/50'}`}>
              <TrendingUp className={`h-5 w-5 ${isDark ? 'text-green-300' : 'text-green-700'}`} />
            </div>
          </div>
          
          {/* Avatar stack for won deals */}
          {valuesByStatus.wonDealsWithContacts && valuesByStatus.wonDealsWithContacts.length > 0 && (
            renderAvatarStack(valuesByStatus.wonDealsWithContacts.map(deal => deal.contact))
          )}
        </div>
        
        <div className={`${isDark ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30' : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'} border rounded-lg p-4`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>Lost Deals (YTD)</p>
              <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>${Math.round(valuesByStatus.lost / 1000)}k</p>
            </div>
            <div className={`p-2 rounded-full ${isDark ? 'bg-red-500/30' : 'bg-red-200/50'}`}>
              <ZapOff className={`h-5 w-5 ${isDark ? 'text-red-300' : 'text-red-700'}`} />
            </div>
          </div>
          
          {/* Avatar stack for lost deals */}
          {valuesByStatus.lostDealsWithContacts && valuesByStatus.lostDealsWithContacts.length > 0 && (
            renderAvatarStack(valuesByStatus.lostDealsWithContacts.map(deal => deal.contact))
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Performance Trend */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Performance Trend</h3>
            <div className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {selectedPeriod} view
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'revenue' ? `$${(value / 1000).toFixed(1)}k` : value,
                    name === 'revenue' ? 'Revenue' : name === 'deals' ? 'Deals Closed' : 'Pipeline Value'
                  ]}
                  labelStyle={{ color: isDark ? '#F3F4F6' : '#374151' }}
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: isDark ? '#111827' : '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pipeline" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Distribution</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pipelineStageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineStageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${(value / 1000).toFixed(1)}k`, 'Value']} 
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Performance */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Stage Performance</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {pipelineStageData.map((stage, index) => (
                <div key={index} className={`flex items-center justify-between p-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{stage.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${(stage.value / 1000).toFixed(1)}k</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stage.deals} deals</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Conversion Rate Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className={`border ${isDark ? 'border-indigo-500/30 bg-indigo-500/20' : 'border-indigo-100 bg-indigo-50'} rounded-lg p-2`}>
                <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'} mb-1`}>Qual → Proposal</p>
                <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversionRates.qualToProposal}%</p>
              </div>
              <div className={`border ${isDark ? 'border-indigo-500/30 bg-indigo-500/20' : 'border-indigo-100 bg-indigo-50'} rounded-lg p-2`}>
                <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'} mb-1`}>Prop → Negotiation</p>
                <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversionRates.proposalToNegotiation}%</p>
              </div>
              <div className={`border ${isDark ? 'border-indigo-500/30 bg-indigo-500/20' : 'border-indigo-100 bg-indigo-50'} rounded-lg p-2`}>
                <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'} mb-1`}>Neg → Won</p>
                <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversionRates.negotiationToWon}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deal Distribution Bar Chart */}
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Deal Distribution by Stage</h3>
          </div>
          <div className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }} />
                  <YAxis 
                    dataKey="stage" 
                    type="category" 
                    tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} deals`, 'Count']}
                    contentStyle={{ 
                      borderRadius: '6px',
                      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats Summary */}
            <div className="mt-4 flex justify-around">
              <div className="text-center">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Top Deal</p>
                <div className="flex items-center justify-center">
                  <DollarSign size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  <span className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>$95k</span>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Avg Time to Close</p>
                <div className="flex items-center justify-center">
                  <Calendar size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  <span className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>32 days</span>
                </div>
              </div>
              <div className="text-center">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Win Rate</p>
                <div className="flex items-center justify-center">
                  <ArrowUp size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  <span className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>24%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Pipeline Value */}
      {monthlyData.length > 0 && (
        <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-xl shadow-sm`}>
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline Value by Month</h3>
          </div>
          <div className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000}k`}
                    tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${(value / 1000).toFixed(1)}k`, 'Pipeline Value']}
                    contentStyle={{ 
                      borderRadius: '6px',
                      backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    dot={{ stroke: '#312e81', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealAnalytics;