import { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';
import { useTheme } from '../contexts/ThemeContext';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAnalyticsStore } from '../store/analyticsStore';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

export default function Analytics() {
  const { isDark } = useTheme();
  const {
    salesMetrics,
    pipelineMetrics,
    taskMetrics,
    communicationMetrics,
    insights,
    forecasts,
    timeRange,
    setTimeRange,
    updateMetrics,
    generateInsights,
    generateForecast,
    compareWithPrevious,
  } = useAnalyticsStore();

  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    updateMetrics();
    generateInsights();
  }, [updateMetrics, generateInsights]);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
    updateMetrics();
  };

  const handleGenerateForecast = async () => {
    setIsLoading(true);
    try {
      await generateForecast(selectedMetric, 30);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const MetricCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    subtitle?: string;
  }) => (
    <GlassCard className="p-6">
      <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{title}</div>
      {icon}
      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && trendValue && (
            <span
              className={`flex items-center gap-1 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
    </GlassCard>
  );

  const SalesOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(salesMetrics.totalRevenue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+15.3%"
          subtitle="vs last month"
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(salesMetrics.winRate)}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+2.1%"
          subtitle="vs last month"
        />
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(salesMetrics.averageDealSize)}
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          trend="down"
          trendValue="-5.2%"
          subtitle="vs last month"
        />
        <MetricCard
          title="Sales Cycle"
          value={`${salesMetrics.salesCycle} days`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          trend="down"
          trendValue="-3 days"
          subtitle="vs last month"
        />
      </div>

      {/* Revenue Trend Chart */}
      <GlassCard className="p-6">
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenue Trend</h3>
        <div className={`h-64 flex items-center justify-center border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'}`}>
          <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <LineChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Revenue trend chart would go here</p>
            <p className="text-sm">Integration with charting library needed</p>
          </div>
        </div>
      </GlassCard>

      {/* Deals Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Deal Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Won Deals</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{salesMetrics.wonDeals}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatPercent(salesMetrics.wonDeals / salesMetrics.totalDeals)}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Lost Deals</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{salesMetrics.lostDeals}</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {formatPercent(salesMetrics.lostDeals / salesMetrics.totalDeals)}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Active Deals</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{salesMetrics.activeDeals}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatPercent(salesMetrics.activeDeals / salesMetrics.totalDeals)}
                </Badge>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Forecast vs Quota</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Forecasted Revenue</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(salesMetrics.forecastedRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Quota Attainment</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatPercent(salesMetrics.quotaAttainment)}
                </Badge>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(salesMetrics.quotaAttainment * 100, 100)}%` }}
                ></div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {salesMetrics.quotaAttainment >= 1 ? 'Quota exceeded!' : 'On track to meet quota'}
              </p>
            </div>
          </GlassCard>
      </div>
    </div>
  );

  const PipelineAnalytics = () => (
    <div className="space-y-6">
      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(pipelineMetrics.totalPipelineValue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+8.4%"
        />
        <MetricCard
          title="Pipeline Velocity"
          value={`${pipelineMetrics.pipelineVelocity}x`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="up"
          trendValue="+0.3x"
        />
        <MetricCard
          title="Pipeline Health"
          value={pipelineMetrics.pipelineHealth}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          trend="neutral"
        />
      </div>

      {/* Deals by Stage */}
      <GlassCard className="p-6">
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Deals by Stage</h3>
          <div className="space-y-4">
            {pipelineMetrics.dealsByStage.map((stage) => (
              <div
                key={stage.stage}
                className={`flex items-center justify-between p-3 border rounded-lg ${isDark ? 'border-gray-700' : ''}`}
              >
                <div>
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{stage.stage}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stage.count} deals</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stage.value)}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatPercent(stage.value / pipelineMetrics.totalPipelineValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
      </GlassCard>

      {/* Stage Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Average Time in Stage</h3>
          <div className="space-y-3">
            {pipelineMetrics.averageTimeInStage.map((stage) => (
              <div key={stage.stage} className="flex justify-between items-center">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stage.stage}</span>
                <Badge variant="outline">{stage.days} days</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Conversion Rates</h3>
          <div className="space-y-3">
            {pipelineMetrics.stageConversionRates.map((stage) => (
              <div key={stage.stage} className="flex justify-between items-center">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{stage.stage}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatPercent(stage.rate)}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottlenecks */}
      {pipelineMetrics.bottlenecks.length > 0 && (
        <GlassCard className="p-6">
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Pipeline Bottlenecks
          </h3>
          <div className="space-y-4">
            {pipelineMetrics.bottlenecks.map((bottleneck, index) => (
              <div key={index} className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{bottleneck.stage}</h4>
                  <Badge
                    variant="outline"
                    className={
                      bottleneck.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : bottleneck.severity === 'medium'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {bottleneck.severity} severity
                  </Badge>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Average time: {bottleneck.averageDays} days (threshold: {bottleneck.threshold} days)
                </p>
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Suggestions:</p>
                  <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {bottleneck.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );

  const InsightsTab = () => (
    <div className="space-y-6">
      {/* AI Insights */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI-Generated Insights</h3>
          <Button size="sm" onClick={generateInsights}>
            Refresh Insights
          </Button>
        </div>
        {insights.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No insights available yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{insight.title}</h4>
                    <Badge variant="outline" className="mt-1">
                      {insight.type}
                    </Badge>
                  </div>
                  <Badge
                    className={
                      insight.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : insight.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : insight.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {insight.severity}
                  </Badge>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{insight.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Confidence:</span>
                  <Badge variant="secondary">{formatPercent(insight.confidence)}</Badge>
                </div>
                {insight.actionable && insight.suggestions.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recommended Actions:</p>
                    <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {insight.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Forecasting */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Forecasting</h3>
          <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleGenerateForecast} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Forecast'}
              </Button>
            </div>
        </div>
        {forecasts.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No forecasts generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {forecasts.map((forecast) => (
              <div key={forecast.metric} className={`p-4 border rounded-lg ${isDark ? 'border-gray-700' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{forecast.metric} Forecast</h4>
                  <Badge variant="secondary">
                    {formatPercent(forecast.confidence)} confidence
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Current</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(forecast.currentValue)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Forecasted</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(forecast.forecastedValue)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Best Case</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(forecast.scenarioAnalysis.best)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Worst Case</p>
                    <p className="font-medium text-red-600">
                      {formatCurrency(forecast.scenarioAnalysis.worst)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Key Factors:</p>
                  <div className="flex flex-wrap gap-2">
                    {forecast.factors.map((factor) => (
                      <Badge key={factor} variant="outline" className="text-xs">
                        {factor.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Track performance and generate insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights & Forecasting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesOverview />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineAnalytics />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Task analytics integration needed</p>
            </div>
          </TabsContent>

          <TabsContent value="communication">
            <div className="text-center py-8 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Communication analytics integration needed</p>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <InsightsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
