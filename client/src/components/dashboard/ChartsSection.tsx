import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';
import { BarChart3, LineChart, PieChart as PieChartIcon, TrendingUp, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ChartsSection: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'performance' | 'pipeline' | 'breakdown'>('performance');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  // Get contacts related to won deals
  const wonDealsContacts = React.useMemo(() => {
    return Object.values(deals)
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
  }, [deals, contacts]);

  // Get contacts for average deal size calculation
  const dealsForAvgSizeContacts = React.useMemo(() => {
    const activeDeals = Object.values(deals).filter(deal => 
      deal.stage !== 'closed-lost'
    );
    
    return activeDeals.map(deal => {
      const contact = contacts[deal.contactId];
      return contact ? {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;
  }, [deals, contacts]);

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
className=""
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sample data for performance chart
  const performanceData = [
    { name: 'Jan', revenue: 12000, deals: 8 },
    { name: 'Feb', revenue: 15000, deals: 10 },
    { name: 'Mar', revenue: 18000, deals: 12 },
    { name: 'Apr', revenue: 16000, deals: 9 },
    { name: 'May', revenue: 21000, deals: 15 },
    { name: 'Jun', revenue: 19000, deals: 14 },
  ];

  // Sample data for pipeline chart
  const pipelineData = [
    { name: 'Leads', value: 120 },
    { name: 'Qualified', value: 85 },
    { name: 'Proposal', value: 60 },
    { name: 'Negotiation', value: 40 },
    { name: 'Closed', value: 30 },
  ];

  // Sample data for breakdown chart
  const breakdownData = [
    { name: 'Software', value: 45 },
    { name: 'Services', value: 25 },
    { name: 'Hardware', value: 15 },
    { name: 'Training', value: 10 },
    { name: 'Other', value: 5 },
  ];

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed'];

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sales Analytics
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Chart Type Tabs */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'performance'
                  ? isDark 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LineChart size={16} className="mr-1.5" />
              <span>Performance</span>
            </button>
            
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'pipeline'
                  ? isDark 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={16} className="mr-1.5" />
              <span>Pipeline</span>
            </button>
            
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex items-center px-3 py-1.5 text-sm ${
                activeTab === 'breakdown'
                  ? isDark 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChartIcon size={16} className="mr-1.5" />
              <span>Breakdown</span>
            </button>
          </div>
          
          {/* Time Frame Selector */}
          <div className="flex">
            {['week', 'month', 'quarter'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as any)}
                className={`px-3 py-1.5 text-sm ${
                  timeframe === period 
                    ? isDark 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : isDark 
                      ? 'text-gray-400 hover:text-gray-300' 
                      : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-80">
        {activeTab === 'performance' && (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={performanceData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: isDark ? '#F3F4F6' : '#374151' }}
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Deals Closed'
                ]}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: isDark ? '#1F2937' : '#ffffff' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="deals" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: isDark ? '#1F2937' : '#ffffff' }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
        
        {activeTab === 'pipeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pipelineData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280' }}
                axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${value} deals`, 'Count']}
              />
              <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {activeTab === 'breakdown' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} deals`, 'Count']}
                contentStyle={{ 
                  backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Conversion Rate
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                23.5%
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Avg Deal Size
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                $12,500
              </div>
            </div>
          </div>
          {/* Add avatar stack for deals */}
          {dealsForAvgSizeContacts.length > 0 && renderAvatarStack(dealsForAvgSizeContacts)}
        </div>
        
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sales Cycle
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                32 days
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Win Rate
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                64%
              </div>
            </div>
          </div>
          {/* Add avatar stack for won deals */}
          {wonDealsContacts.length > 0 && renderAvatarStack(wonDealsContacts)}
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;