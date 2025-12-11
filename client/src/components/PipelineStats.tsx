import React from 'react';
import { useDealStore } from '../store/dealStore';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  BarChart4, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar
} from 'lucide-react';

const PipelineStats: React.FC = () => {
  const { stageValues, totalPipelineValue, deals } = useDealStore();
  
  // Calculate conversion metrics (based on deal counts)
  const calculateMetrics = () => {
    let totalDeals = 0;
    let qualificationDeals = 0;
    let proposalDeals = 0;
    let negotiationDeals = 0;
    let wonDeals = 0;
    let lostDeals = 0;
    
    Object.values(deals).forEach(deal => {
      totalDeals++;
      switch(deal.stage) {
        case 'qualification':
          qualificationDeals++;
          break;
        case 'proposal':
          proposalDeals++;
          break;
        case 'negotiation':
          negotiationDeals++;
          break;
        case 'closed-won':
          wonDeals++;
          break;
        case 'closed-lost':
          lostDeals++;
          break;
      }
    });
    
    // Calculate average deal size
    const avgDealSize = totalDeals > 0 ? 
      Object.values(deals).reduce((sum, deal) => sum + deal.value, 0) / totalDeals : 0;
      
    // Calculate win rate
    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;
    
    // Calculate conversion rates
    const qualToProposalRate = qualificationDeals > 0 ? 
      (proposalDeals / qualificationDeals) * 100 : 0;
      
    const proposalToNegotiationRate = proposalDeals > 0 ?
      (negotiationDeals / proposalDeals) * 100 : 0;
      
    const negotiationToWonRate = negotiationDeals > 0 ?
      (wonDeals / negotiationDeals) * 100 : 0;
    
    return {
      totalDeals,
      avgDealSize,
      winRate,
      qualToProposalRate,
      proposalToNegotiationRate,
      negotiationToWonRate
    };
  };
  
  const metrics = calculateMetrics();
  
  // Get a color class for percentage changes
  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get the trend arrow for percentage changes
  const TrendArrow = ({ value }: { value: number }) => {
    if (value > 0) return <ArrowUpRight size={16} className="text-green-500" />;
    if (value < 0) return <ArrowDownRight size={16} className="text-red-500" />;
    return null;
  };
  
  // Calculate the column widths for the pipeline visualization
  const columnWidths = Object.keys(stageValues).reduce<Record<string, number>>((acc, columnId) => {
    acc[columnId] = totalPipelineValue > 0 
      ? (stageValues[columnId] / totalPipelineValue) * 100 
      : 0;
    return acc;
  }, {});
  
  // Get color class for stage
  const getStageColorClass = (stageId: string) => {
    switch(stageId) {
      case 'qualification': return 'bg-blue-500';
      case 'proposal': return 'bg-indigo-500';
      case 'negotiation': return 'bg-purple-500';
      case 'closed-won': return 'bg-green-500';
      case 'closed-lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Pipeline Metrics</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={14} className="mr-1.5" />
          <span>Current Period</span>
        </div>
      </div>
      
      {/* Pipeline value visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-medium text-gray-500">Pipeline Distribution</p>
          <p className="text-xl font-bold">{formatCurrency(totalPipelineValue)}</p>
        </div>
        
        <div className="h-8 w-full flex rounded-md overflow-hidden">
          {Object.keys(stageValues)
            .filter(stageId => stageId !== 'closed-lost') // Exclude lost deals from visualization
            .map(stageId => (
              <div 
                key={stageId}
                className={`h-full ${getStageColorClass(stageId)} relative group transition-all`}
                style={{ width: `${columnWidths[stageId]}%` }}
              >
                {columnWidths[stageId] >= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {Math.round(columnWidths[stageId])}%
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {stageId.replace('-', ' ')}: {formatCurrency(stageValues[stageId])}
                </div>
              </div>
            ))}
        </div>
        
        <div className="mt-2 flex justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
            <span>Qualification</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></div>
            <span>Proposal</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
            <span>Negotiation</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span>Won</span>
          </div>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-700">Win Rate</p>
              <p className="text-xl font-bold mt-1">{metrics.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-blue-200/50 rounded-full">
              <PieChart size={18} className="text-blue-700" />
            </div>
          </div>
          <div className="flex items-center mt-1 text-xs">
            <TrendArrow value={10} />
            <span className={getTrendColor(10)}>
              {10.0}% vs last period
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-indigo-700">Avg Deal Size</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(metrics.avgDealSize)}</p>
            </div>
            <div className="p-2 bg-indigo-200/50 rounded-full">
              <DollarSign size={18} className="text-indigo-700" />
            </div>
          </div>
          <div className="flex items-center mt-1 text-xs">
            <TrendArrow value={5} />
            <span className={getTrendColor(5)}>
              {5.0}% vs last period
            </span>
          </div>
        </div>
      </div>
      
      {/* Conversion metrics */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Conversion Rates</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Qualification → Proposal</span>
              <span className="font-medium">{metrics.qualToProposalRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${metrics.qualToProposalRate}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Proposal → Negotiation</span>
              <span className="font-medium">{metrics.proposalToNegotiationRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-indigo-500"
                style={{ width: `${metrics.proposalToNegotiationRate}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Negotiation → Closed Won</span>
              <span className="font-medium">{metrics.negotiationToWonRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-purple-500"
                style={{ width: `${metrics.negotiationToWonRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineStats;