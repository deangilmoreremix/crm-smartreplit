import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  BarChart3,
  Filter,
  Calendar,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { Deal, DealStage } from '../types/deal';

interface VelocityMetric {
  stage: string;
  averageDays: number;
  dealCount: number;
  conversionRate: number;
  bottleneck: boolean;
}

interface VelocityTrend {
  period: string;
  averageCycle: number;
  dealsClosed: number;
  revenue: number;
}

interface StageAnalysis {
  name: string;
  averageDays: number;
  minDays: number;
  maxDays: number;
  dealCount: number;
  conversionRate: number;
  stuckDeals: number;
}

const SalesVelocityChart: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [selectedView, setSelectedView] = useState<'velocity' | 'stages' | 'trends'>('velocity');
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  
  const { deals, getActivePipeline, getSalesMetrics } = useDealStore();
  
  const pipeline = getActivePipeline();
  const metrics = getSalesMetrics();

  // Calculate velocity metrics by stage
  const velocityMetrics: VelocityMetric[] = useMemo(() => {
    if (!pipeline) return [];
    
    return pipeline.stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage.id === stage.id);
      const completedDeals = stageDeals.filter(deal => deal.status === 'won' || deal.status === 'lost');
      
      // Calculate average days in this stage
      const daysInStage = stageDeals.map(deal => deal.daysInStage || 0);
      const averageDays = daysInStage.length > 0 
        ? daysInStage.reduce((sum, days) => sum + days, 0) / daysInStage.length 
        : 0;
      
      // Calculate conversion rate (deals that moved forward vs. stuck/lost)
      const convertedDeals = stageDeals.filter(deal => {
        const stageIndex = pipeline.stages.findIndex(s => s.id === stage.id);
        const dealStageIndex = pipeline.stages.findIndex(s => s.id === deal.stage.id);
        return dealStageIndex > stageIndex || deal.status === 'won';
      });
      const conversionRate = stageDeals.length > 0 ? (convertedDeals.length / stageDeals.length) * 100 : 0;
      
      // Identify bottlenecks (stages taking significantly longer than average)
      const isBottleneck = averageDays > metrics.averageSalesCycle * 0.3;
      
      return {
        stage: stage.name,
        averageDays: Math.round(averageDays),
        dealCount: stageDeals.length,
        conversionRate,
        bottleneck: isBottleneck
      };
    });
  }, [deals, pipeline, metrics.averageSalesCycle]);

  // Calculate velocity trends over time
  const velocityTrends: VelocityTrend[] = useMemo(() => {
    const trends = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() - i);
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      
      const periodDeals = deals.filter(deal => {
        if (deal.status !== 'won') return false;
        return deal.updatedAt >= startDate && deal.updatedAt <= endDate;
      });
      
      const totalCycleDays = periodDeals.reduce((sum, deal) => {
        const cycleTime = deal.updatedAt.getTime() - deal.createdAt.getTime();
        return sum + (cycleTime / (1000 * 60 * 60 * 24));
      }, 0);
      
      const averageCycle = periodDeals.length > 0 ? totalCycleDays / periodDeals.length : 0;
      const revenue = periodDeals.reduce((sum, deal) => sum + deal.value, 0);
      
      trends.push({
        period: endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        averageCycle: Math.round(averageCycle),
        dealsClosed: periodDeals.length,
        revenue
      });
    }
    
    return trends;
  }, [deals]);

  // Detailed stage analysis
  const stageAnalysis: StageAnalysis[] = useMemo(() => {
    if (!pipeline) return [];
    
    return pipeline.stages.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage.id === stage.id);
      const daysInStage = stageDeals.map(deal => deal.daysInStage || 0).filter(days => days > 0);
      
      const averageDays = daysInStage.length > 0 
        ? daysInStage.reduce((sum, days) => sum + days, 0) / daysInStage.length 
        : 0;
      
      const minDays = daysInStage.length > 0 ? Math.min(...daysInStage) : 0;
      const maxDays = daysInStage.length > 0 ? Math.max(...daysInStage) : 0;
      
      // Calculate conversion rate to next stage
      const stageIndex = pipeline.stages.findIndex(s => s.id === stage.id);
      const nextStageDeals = stageIndex < pipeline.stages.length - 1 
        ? deals.filter(deal => {
            const dealStageIndex = pipeline.stages.findIndex(s => s.id === deal.stage.id);
            return dealStageIndex > stageIndex;
          }).length
        : deals.filter(deal => deal.status === 'won').length;
      
      const conversionRate = stageDeals.length > 0 ? (nextStageDeals / stageDeals.length) * 100 : 0;
      
      // Count deals stuck in stage (more than 2x average cycle time)
      const stuckThreshold = averageDays * 2;
      const stuckDeals = stageDeals.filter(deal => (deal.daysInStage || 0) > stuckThreshold).length;
      
      return {
        name: stage.name,
        averageDays: Math.round(averageDays),
        minDays,
        maxDays,
        dealCount: stageDeals.length,
        conversionRate,
        stuckDeals
      };
    });
  }, [deals, pipeline]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVelocityColor = (days: number) => {
    if (days <= 7) return 'text-green-600 bg-green-50';
    if (days <= 14) return 'text-yellow-600 bg-yellow-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    if (rate >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const renderVelocityChart = () => {
    const maxDays = Math.max(...velocityMetrics.map(m => m.averageDays));
    
    return (
      <div className="space-y-4">
        {velocityMetrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium text-gray-900">{metric.stage}</h4>
                {metric.bottleneck && showBottlenecks && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Bottleneck
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Avg. Days</div>
                  <div className={`px-2 py-1 rounded-full font-medium ${getVelocityColor(metric.averageDays)}`}>
                    {metric.averageDays}d
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Deals</div>
                  <div className="font-medium text-gray-900">{metric.dealCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Conversion</div>
                  <div className={`px-2 py-1 rounded-full font-medium ${getConversionColor(metric.conversionRate)}`}>
                    {metric.conversionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${metric.bottleneck ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${(metric.averageDays / maxDays) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTrendsChart = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Velocity Trends</h4>
          <div className="space-y-4">
            {velocityTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{trend.period}</div>
                <div className="flex space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Avg. Cycle</div>
                    <div className="font-medium text-blue-600">{trend.averageCycle}d</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Deals Closed</div>
                    <div className="font-medium text-green-600">{trend.dealsClosed}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="font-medium text-purple-600">{formatCurrency(trend.revenue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStageAnalysis = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Detailed Stage Analysis</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stuck Deals
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stageAnalysis.map((stage, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVelocityColor(stage.averageDays)}`}>
                        {stage.averageDays}d
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stage.minDays}d - {stage.maxDays}d
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stage.dealCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConversionColor(stage.conversionRate)}`}>
                        {stage.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stage.stuckDeals > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {stage.stuckDeals}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sales Velocity Analysis</h2>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Sales Cycle</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.averageSalesCycle}d</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">15% faster than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">5% improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900">{deals.filter(d => d.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">12 new this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bottlenecks</p>
              <p className="text-2xl font-bold text-gray-900">
                {velocityMetrics.filter(m => m.bottleneck).length}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Info className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-yellow-600">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Velocity Analysis</h3>
          <div className="flex items-center space-x-4">
            {/* View Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <div className="flex border border-gray-300 rounded-md">
                {[
                  { id: 'velocity', label: 'Velocity' },
                  { id: 'stages', label: 'Stages' },
                  { id: 'trends', label: 'Trends' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id as any)}
                    className={`px-3 py-1 text-sm font-medium ${
                      selectedView === view.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    } ${view.id === 'velocity' ? 'rounded-l-md' : view.id === 'trends' ? 'rounded-r-md' : ''}`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Timeframe:</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
              </select>
            </div>

            {/* Bottleneck Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showBottlenecks"
                checked={showBottlenecks}
                onChange={(e) => setShowBottlenecks(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showBottlenecks" className="text-sm font-medium text-gray-700">
                Highlight Bottlenecks
              </label>
            </div>
          </div>
        </div>

        {/* Content */}
        {selectedView === 'velocity' && renderVelocityChart()}
        {selectedView === 'stages' && renderStageAnalysis()}
        {selectedView === 'trends' && renderTrendsChart()}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Velocity Optimization Recommendations</h3>
        <div className="space-y-4">
          {velocityMetrics
            .filter(metric => metric.bottleneck)
            .map((metric, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{metric.stage} Stage Optimization</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    This stage is taking {metric.averageDays} days on average, which is above the optimal range. 
                    Consider implementing automated follow-ups or additional qualification criteria to accelerate deal progression.
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    Current: {metric.dealCount} deals • Conversion: {metric.conversionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          
          {velocityMetrics.filter(metric => metric.bottleneck).length === 0 && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Great Pipeline Velocity!</h3>
              <p className="text-gray-500">No significant bottlenecks detected in your sales process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesVelocityChart;
