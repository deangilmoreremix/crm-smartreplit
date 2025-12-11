import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { aiUsageTracker, type ToolMetrics, type CategoryMetrics } from '../../services/aiUsageTracker';
import { BarChart3, TrendingUp, Clock, Zap, Brain, Activity, Users, Target } from 'lucide-react';

export default function AIUsageStatsPanel() {
  const { isDark } = useTheme();
  const [usageStats, setUsageStats] = useState<any>(null);
  const [toolMetrics, setToolMetrics] = useState<ToolMetrics[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics[]>([]);
  const [trendingTools, setTrendingTools] = useState<ToolMetrics[]>([]);

  useEffect(() => {
    loadUsageData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadUsageData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsageData = () => {
    const stats = aiUsageTracker.getUsageStats();
    const tools = aiUsageTracker.getAllToolMetrics();
    const categories = aiUsageTracker.getCategoryMetrics();
    const trending = aiUsageTracker.getTrendingTools(7);

    setUsageStats(stats);
    setToolMetrics(tools);
    setCategoryMetrics(categories);
    setTrendingTools(trending);
  };

  if (!usageStats) {
    return (
      <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
              <p className="text-2xl font-bold">{usageStats.totalUsage.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold">{usageStats.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
              <p className="text-2xl font-bold">{usageStats.averageExecutionTime.toFixed(0)}ms</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Tools</p>
              <p className="text-2xl font-bold">{usageStats.activeTools}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tools */}
      <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Trending Tools (Last 7 Days)
        </h3>
        {trendingTools.length > 0 ? (
          <div className="space-y-3">
            {trendingTools.slice(0, 5).map((tool, index) => (
              <div key={tool.toolId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{tool.toolName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.totalUsage} uses • {tool.successRate.toFixed(1)}% success
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    ↗ {tool.popularityScore.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No trending data available yet</p>
        )}
      </div>

      {/* Category Performance */}
      <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Category Performance
        </h3>
        {categoryMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryMetrics.map((category) => (
              <div key={category.category} className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{category.category}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.toolCount} tools
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Usage:</span>
                    <span className="font-semibold">{category.totalUsage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-semibold">{category.averageSuccessRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Top Tool:</span>
                    <span className="font-semibold text-blue-600">{category.mostUsedTool}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No category data available yet</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        {usageStats.recentUsage && usageStats.recentUsage.length > 0 ? (
          <div className="space-y-3">
            {usageStats.recentUsage.slice(0, 5).map((usage: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    usage.success ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{usage.toolName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {usage.category} • {usage.executionTime}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(usage.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>

      {/* Performance Insights */}
      <div className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-200'
          } border`}>
            <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Top Performer</h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              {usageStats.topPerformingCategory} category leads with highest success rate
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'
          } border`}>
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Recommendation</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {usageStats.successRate > 90 ? 'Excellent performance!' : 
               usageStats.successRate > 75 ? 'Good performance, room for improvement' :
               'Consider optimizing tool configurations'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
