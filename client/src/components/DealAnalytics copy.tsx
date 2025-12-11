import React, { useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDealStore } from '../store/dealStore';
import { DollarSign, Calendar, ArrowUp, ArrowDown, TrendingUp, Activity, ZapOff } from 'lucide-react';

interface DealAnalyticsProps {
  title?: string;
  className?: string;
}

const DealAnalytics: React.FC<DealAnalyticsProps> = ({ 
  title = 'Deal Analytics', 
  className = '' 
}) => {
  const { deals, stageValues } = useDealStore();
  
  // Create a ref for chart resizing
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate deals in each stage
  const dealCounts = {
    qualification: 0,
    proposal: 0,
    negotiation: 0,
    'closed-won': 0,
    'closed-lost': 0
  };
  
  // Calculate monthly pipeline value
  const pipelineByMonth: Record<string, number> = {};
  
  Object.values(deals).forEach(deal => {
    // Count by stage
    if (dealCounts.hasOwnProperty(deal.stage)) {
      dealCounts[deal.stage as keyof typeof dealCounts]++;
    }
    
    // Add to monthly totals (only count open deals)
    if (deal.stage !== 'closed-won' && deal.stage !== 'closed-lost') {
      const month = deal.dueDate ? 
        `${deal.dueDate.getFullYear()}-${String(deal.dueDate.getMonth() + 1).padStart(2, '0')}` : 
        'No date';
        
      pipelineByMonth[month] = (pipelineByMonth[month] || 0) + deal.value;
    }
  });
  
  // Convert to array format for charts
  const stageData = Object.entries(dealCounts).map(([stage, count]) => ({
    stage: stage === 'closed-won' ? 'Won' : 
           stage === 'closed-lost' ? 'Lost' :
           stage === 'qualification' ? 'Qualified' : 
           stage === 'proposal' ? 'Proposed' : 'Negotiating',
    count
  }));
  
  const monthlyData = Object.entries(pipelineByMonth)
    .sort()  // Sort by month
    .map(([month, value]) => ({
      month: month === 'No date' ? month : month.split('-')[1],  // Just show the month number
      value
    }));
    
  // Calculate conversion rates between stages
  const calculateConversionRate = (fromStage: string, toStage: string) => {
    const fromCount = dealCounts[fromStage as keyof typeof dealCounts];
    const toCount = dealCounts[toStage as keyof typeof dealCounts];
    
    return fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
  };
  
  const conversionRates = {
    qualToProposal: calculateConversionRate('qualification', 'proposal'),
    proposalToNegotiation: calculateConversionRate('proposal', 'negotiation'),
    negotiationToWon: calculateConversionRate('negotiation', 'closed-won')
  };
  
  // Calculate total value by status
  const valueByStatus = {
    active: stageValues.qualification + stageValues.proposal + stageValues.negotiation,
    won: stageValues['closed-won'],
    lost: stageValues['closed-lost']
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-blue-800">Active Pipeline</p>
              <p className="text-xl font-semibold mt-1">${Math.round(valueByStatus.active / 1000)}k</p>
            </div>
            <div className="p-2 rounded-full bg-blue-200/50">
              <Activity className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-green-800">Won Deals (YTD)</p>
              <p className="text-xl font-semibold mt-1">${Math.round(valueByStatus.won / 1000)}k</p>
            </div>
            <div className="p-2 rounded-full bg-green-200/50">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-red-800">Lost Deals (YTD)</p>
              <p className="text-xl font-semibold mt-1">${Math.round(valueByStatus.lost / 1000)}k</p>
            </div>
            <div className="p-2 rounded-full bg-red-200/50">
              <ZapOff className="h-5 w-5 text-red-700" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Deal Distribution by Stage</h3>
          <div className="h-64" ref={chartContainerRef}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip 
                  formatter={(value: any) => [`${value} deals`, 'Count']}
                  contentStyle={{ borderRadius: '6px' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#4f46e5"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-2">
              <p className="text-xs text-indigo-600 mb-1">Qual → Proposal</p>
              <p className="text-lg font-medium">{conversionRates.qualToProposal}%</p>
            </div>
            <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-2">
              <p className="text-xs text-indigo-600 mb-1">Prop → Negotiation</p>
              <p className="text-lg font-medium">{conversionRates.proposalToNegotiation}%</p>
            </div>
            <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-2">
              <p className="text-xs text-indigo-600 mb-1">Neg → Won</p>
              <p className="text-lg font-medium">{conversionRates.negotiationToWon}%</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pipeline Value by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: any) => [`$${(value / 1000).toFixed(1)}k`, 'Pipeline Value']}
                  contentStyle={{ borderRadius: '6px' }}
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
          
          <div className="mt-4 flex justify-around">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Top Deal</p>
              <div className="flex items-center justify-center">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-base font-medium">$95k</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Time to Close</p>
              <div className="flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-base font-medium">32 days</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Win Rate</p>
              <div className="flex items-center justify-center">
                <ArrowUp size={16} className="text-green-600" />
                <span className="text-base font-medium">24%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealAnalytics;