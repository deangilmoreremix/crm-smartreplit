import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useDealStore } from '../store/dealStore';
import { DealForecast, SalesMetrics } from '../types/deal';

interface ForecastData {
  month: string;
  conservative: number;
  realistic: number;
  optimistic: number;
  actual?: number;
}

interface QuarterlyForecast {
  quarter: string;
  target: number;
  forecast: number;
  pipeline: number;
  achievement: number;
}

const RevenueForecasting: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedView, setSelectedView] = useState<'chart' | 'table' | 'pipeline'>('chart');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m');
  
  const { deals, getActivePipeline, getSalesMetrics, calculateForecast } = useDealStore();
  
  const pipeline = getActivePipeline();
  const metrics = getSalesMetrics();
  const forecast = calculateForecast();

  // Generate forecast data for the next 6 months
  const forecastData: ForecastData[] = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + i);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Calculate forecasts based on deals expected to close in this month
      const monthDeals = deals.filter(deal => {
        if (!deal.expectedCloseDate) return false;
        const dealMonth = deal.expectedCloseDate.getMonth();
        const dealYear = deal.expectedCloseDate.getFullYear();
        return dealMonth === date.getMonth() && dealYear === date.getFullYear();
      });
      
      const totalValue = monthDeals.reduce((sum, deal) => sum + deal.value, 0);
      const weightedValue = monthDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
      
      months.push({
        month: monthName,
        conservative: weightedValue * 0.7,
        realistic: weightedValue,
        optimistic: weightedValue * 1.3,
        actual: i === 0 ? totalValue * 0.8 : undefined // Simulate actual for current month
      });
    }
    
    return months;
  }, [deals]);

  // Generate quarterly forecast
  const quarterlyData: QuarterlyForecast[] = useMemo(() => {
    const quarters = [];
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    
    for (let i = 0; i < 4; i++) {
      const quarter = (currentQuarter + i) % 4 + 1;
      const year = currentDate.getFullYear() + Math.floor((currentQuarter + i) / 4);
      
      // Calculate quarter metrics
      const target = 500000 + (i * 50000); // Example targets
      const pipelineValue = deals
        .filter(deal => {
          if (!deal.expectedCloseDate) return false;
          const dealQuarter = Math.floor(deal.expectedCloseDate.getMonth() / 3) + 1;
          const dealYear = deal.expectedCloseDate.getFullYear();
          return dealQuarter === quarter && dealYear === year;
        })
        .reduce((sum, deal) => sum + deal.value, 0);
      
      const forecastValue = pipelineValue * 0.6; // 60% close rate assumption
      const achievement = i === 0 ? 85 : 0; // Current quarter achievement
      
      quarters.push({
        quarter: `Q${quarter} ${year}`,
        target,
        forecast: forecastValue,
        pipeline: pipelineValue,
        achievement
      });
    }
    
    return quarters;
  }, [deals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <div className="h-4 w-4" />;
  };

  const renderChart = () => {
    if (selectedPeriod === 'monthly') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Monthly Revenue Forecast</h4>
            <div className="space-y-3">
              {forecastData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">{data.month}</div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Conservative</div>
                      <div className="font-medium text-red-600">{formatCurrency(data.conservative)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Realistic</div>
                      <div className="font-medium text-blue-600">{formatCurrency(data.realistic)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Optimistic</div>
                      <div className="font-medium text-green-600">{formatCurrency(data.optimistic)}</div>
                    </div>
                    {data.actual && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Actual</div>
                        <div className="font-medium text-gray-900">{formatCurrency(data.actual)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedPeriod === 'quarterly') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Quarterly Revenue Forecast</h4>
            <div className="space-y-3">
              {quarterlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">{data.quarter}</div>
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Target</div>
                      <div className="font-medium text-gray-900">{formatCurrency(data.target)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Forecast</div>
                      <div className="font-medium text-blue-600">{formatCurrency(data.forecast)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Pipeline</div>
                      <div className="font-medium text-green-600">{formatCurrency(data.pipeline)}</div>
                    </div>
                    {data.achievement > 0 && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Achievement</div>
                        <div className="font-medium text-purple-600">{data.achievement}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Yearly Forecast</h3>
        <p className="text-gray-500">Yearly forecasting view coming soon</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Forecasting</h2>
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.totalPipeline)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(forecast.totalPipeline, forecast.totalPipeline * 0.9)}
            <span className="ml-1 text-green-600">12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weighted Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.weightedPipeline)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(forecast.weightedPipeline, forecast.weightedPipeline * 0.95)}
            <span className="ml-1 text-green-600">5% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.winRate)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(metrics.winRate, metrics.winRate - 5)}
            <span className="ml-1 text-green-600">3% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Deal Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageDealSize)}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(metrics.averageDealSize, metrics.averageDealSize * 0.92)}
            <span className="ml-1 text-green-600">8% from last month</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Forecast Analysis</h3>
          <div className="flex items-center space-x-4">
            {/* Period Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* View Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <div className="flex border border-gray-300 rounded-md">
                {[
                  { id: 'chart', icon: BarChart3, label: 'Chart' },
                  { id: 'table', icon: LineChart, label: 'Table' },
                  { id: 'pipeline', icon: PieChart, label: 'Pipeline' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id as any)}
                    className={`inline-flex items-center px-3 py-1 text-sm font-medium ${
                      selectedView === view.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    } ${view.id === 'chart' ? 'rounded-l-md' : view.id === 'pipeline' ? 'rounded-r-md' : ''}`}
                  >
                    <view.icon className="h-4 w-4 mr-1" />
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart/Table Content */}
        {renderChart()}
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Case Scenario</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Next Month</span>
              <span className="font-medium text-green-600">
                {formatCurrency(forecastData[1]?.optimistic || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Quarter</span>
              <span className="font-medium text-green-600">
                {formatCurrency(quarterlyData[1]?.forecast * 1.3 || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confidence Level</span>
              <span className="font-medium text-gray-900">25%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Likely Scenario</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Next Month</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(forecastData[1]?.realistic || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Quarter</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(quarterlyData[1]?.forecast || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confidence Level</span>
              <span className="font-medium text-gray-900">70%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Health Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900">Velocity</h4>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {metrics.averageSalesCycle}d
            </p>
            <p className="text-sm text-gray-500">Avg. cycle time</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Coverage</h4>
            <p className="text-2xl font-bold text-blue-600 mt-1">3.2x</p>
            <p className="text-sm text-gray-500">Pipeline to quota</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900">Quality</h4>
            <p className="text-2xl font-bold text-purple-600 mt-1">85%</p>
            <p className="text-sm text-gray-500">Qualified deals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;
