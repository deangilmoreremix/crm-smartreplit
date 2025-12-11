import React from 'react';
import { BarChart3, DollarSign, Zap, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { AI_MODELS } from '../services/aiModels';

interface ModelUsage {
  modelId: string;
  requests: number;
  tokensUsed: number;
  cost: number;
  avgResponseTime: number;
}

interface AIModelUsageStatsProps {
  usage?: ModelUsage[];
  timeframe?: 'today' | 'week' | 'month';
  className?: string;
}

const AIModelUsageStats: React.FC<AIModelUsageStatsProps> = ({
  usage = [],
  timeframe = 'month',
  className = ''
}) => {
  const { isDark } = useTheme();

  // Demo data if no usage provided
  const demoUsage: ModelUsage[] = [
    {
      modelId: 'gemini-2.5-flash',
      requests: 145,
      tokensUsed: 87500,
      cost: 8.75,
      avgResponseTime: 1.2
    },
    {
      modelId: 'gemma-2-9b-it',
      requests: 89,
      tokensUsed: 42300,
      cost: 3.45,
      avgResponseTime: 0.8
    },
    {
      modelId: 'gemini-2.5-flash-8b',
      requests: 67,
      tokensUsed: 33200,
      cost: 2.10,
      avgResponseTime: 0.6
    }
  ];

  const stats = usage.length > 0 ? usage : demoUsage;
  const totalCost = stats.reduce((sum, stat) => sum + stat.cost, 0);
  const totalRequests = stats.reduce((sum, stat) => sum + stat.requests, 0);
  const totalTokens = stats.reduce((sum, stat) => sum + stat.tokensUsed, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <DollarSign size={16} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Cost ({timeframe})
              </p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(totalCost)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <Zap size={16} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                API Requests
              </p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatNumber(totalRequests)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
            }`}>
              <BarChart3 size={16} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tokens Used
              </p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatNumber(totalTokens)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
            }`}>
              <Clock size={16} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Response
              </p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(stats.reduce((sum, stat) => sum + stat.avgResponseTime, 0) / stats.length).toFixed(1)}s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Usage Breakdown */}
      <div className={`rounded-xl border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
      } overflow-hidden`}>
        <div className="p-4 border-b border-white/10">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Model Usage Breakdown
          </h3>
        </div>
        
        <div className="divide-y divide-white/10">
          {stats.map((stat) => {
            const model = AI_MODELS[stat.modelId];
            if (!model) return null;

            const usagePercent = (stat.requests / totalRequests) * 100;
            const costPercent = (stat.cost / totalCost) * 100;

            return (
              <div key={stat.modelId} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      model.family === 'gemini' 
                        ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                        : (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600')
                    }`}>
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {model.name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {model.family} • {model.version}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(stat.cost)}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {costPercent.toFixed(1)}% of total
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Requests
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatNumber(stat.requests)}
                    </p>
                  </div>
                  <div>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Tokens
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatNumber(stat.tokensUsed)}
                    </p>
                  </div>
                  <div>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Avg Speed
                    </p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stat.avgResponseTime.toFixed(1)}s
                    </p>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="mt-3">
                  <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {usagePercent.toFixed(1)}% of total requests
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AIModelUsageStats;