import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
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
  LineChart
} from 'lucide-react';

export default function Analytics() {
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
    compareWithPrevious
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
      maximumFractionDigits: 0
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
    subtitle 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && trendValue && (
            <span className={`flex items-center gap-1 ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
            <div className="text-center text-gray-500">
              <LineChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Revenue trend chart would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Won Deals</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{salesMetrics.wonDeals}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formatPercent(salesMetrics.wonDeals / salesMetrics.totalDeals)}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Lost Deals</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{salesMetrics.lostDeals}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {formatPercent(salesMetrics.lostDeals / salesMetrics.totalDeals)}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Deals</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{salesMetrics.activeDeals}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {formatPercent(salesMetrics.activeDeals / salesMetrics.totalDeals)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast vs Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Forecasted Revenue</span>
                <span className="font-medium">{formatCurrency(salesMetrics.forecastedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Quota Attainment</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatPercent(salesMetrics.quotaAttainment)}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(salesMetrics.quotaAttainment * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {salesMetrics.quotaAttainment >= 1 ? 'Quota exceeded!' : 'On track to meet quota'}
              </p>
            </div>
          </CardContent>
        </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Deals by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineMetrics.dealsByStage.map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{stage.stage}</h4>
                  <p className="text-sm text-gray-600">{stage.count} deals</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(stage.value)}</p>
                  <p className="text-sm text-gray-600">
                    {formatPercent(stage.value / pipelineMetrics.totalPipelineValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Time in Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pipelineMetrics.averageTimeInStage.map((stage) => (
                <div key={stage.stage} className="flex justify-between items-center">
                  <span>{stage.stage}</span>
                  <Badge variant="outline">{stage.days} days</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pipelineMetrics.stageConversionRates.map((stage) => (
                <div key={stage.stage} className="flex justify-between items-center">
                  <span>{stage.stage}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {formatPercent(stage.rate)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks */}
      {pipelineMetrics.bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Pipeline Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineMetrics.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{bottleneck.stage}</h4>
                    <Badge variant="outline" className={
                      bottleneck.severity === 'high' ? 'bg-red-100 text-red-800' :
                      bottleneck.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {bottleneck.severity} severity
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Average time: {bottleneck.averageDays} days (threshold: {bottleneck.threshold} days)
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Suggestions:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
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
          </CardContent>
        </Card>
      )}
    </div>
  );

  const InsightsTab = () => (
    <div className="space-y-6">
      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI-Generated Insights</CardTitle>
            <Button size="sm" onClick={generateInsights}>
              Refresh Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No insights available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className="mt-1">
                        {insight.type}
                      </Badge>
                    </div>
                    <Badge className={
                      insight.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      insight.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <Badge variant="secondary">
                      {formatPercent(insight.confidence)}
                    </Badge>
                  </div>
                  {insight.actionable && insight.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
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
        </CardContent>
      </Card>

      {/* Forecasting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Forecasting</CardTitle>
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
              <Button 
                size="sm" 
                onClick={handleGenerateForecast}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Forecast'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {forecasts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No forecasts generated yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <div key={forecast.metric} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium capitalize">{forecast.metric} Forecast</h4>
                    <Badge variant="secondary">
                      {formatPercent(forecast.confidence)} confidence
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Current</p>
                      <p className="font-medium">{formatCurrency(forecast.currentValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Forecasted</p>
                      <p className="font-medium">{formatCurrency(forecast.forecastedValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Best Case</p>
                      <p className="font-medium text-green-600">{formatCurrency(forecast.scenarioAnalysis.best)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Worst Case</p>
                      <p className="font-medium text-red-600">{formatCurrency(forecast.scenarioAnalysis.worst)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Key Factors:</p>
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
        </CardContent>
      </Card>
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
