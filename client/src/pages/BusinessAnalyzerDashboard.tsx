import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import GlassCard from '../components/GlassCard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
  Zap,
  Eye,
  Settings,
  Sparkles,
  Calendar,
  Filter,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  LineChart,
  FileText
} from 'lucide-react';

interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'customers' | 'operations' | 'marketing';
  period: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  recommendation: string;
  gpt5Analysis?: {
    reasoning: string;
    dataPoints: string[];
    predictedOutcome: string;
  };
}

interface Report {
  id: string;
  title: string;
  type: 'performance' | 'forecast' | 'comparison' | 'custom';
  status: 'generating' | 'ready' | 'error';
  createdDate: string;
  data: any;
}

interface BusinessStats {
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  customerRetention: number;
  monthlyGrowth: number;
  aiAccuracy: number;
  insightsGenerated: number;
}

export default function BusinessAnalyzerDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState<BusinessMetric | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [analysisFrequency, setAnalysisFrequency] = useState('daily');
  const [insightThreshold, setInsightThreshold] = useState('medium');
  const [dataSources, setDataSources] = useState('all');
  const [reportFormat, setReportFormat] = useState('interactive');

  // Mock data
  const mockMetrics: BusinessMetric[] = [
    {
      id: '1',
      name: 'Monthly Revenue',
      value: 125000,
      change: 12.5,
      trend: 'up',
      category: 'revenue',
      period: 'This Month'
    },
    {
      id: '2',
      name: 'Active Customers',
      value: 2847,
      change: 8.3,
      trend: 'up',
      category: 'customers',
      period: 'This Month'
    },
    {
      id: '3',
      name: 'Conversion Rate',
      value: 3.2,
      change: -2.1,
      trend: 'down',
      category: 'marketing',
      period: 'This Month'
    },
    {
      id: '4',
      name: 'Average Order Value',
      value: 89.50,
      change: 5.7,
      trend: 'up',
      category: 'revenue',
      period: 'This Month'
    },
    {
      id: '5',
      name: 'Customer Retention',
      value: 78.4,
      change: 3.2,
      trend: 'up',
      category: 'customers',
      period: 'This Month'
    },
    {
      id: '6',
      name: 'Operational Efficiency',
      value: 92.1,
      change: 1.8,
      trend: 'up',
      category: 'operations',
      period: 'This Month'
    }
  ];

  const mockInsights: Insight[] = [
    {
      id: '1',
      title: 'Revenue Growth Opportunity',
      description: 'Customer segment analysis shows 15% potential revenue increase through targeted upsell campaigns',
      impact: 'high',
      confidence: 0.89,
      category: 'Revenue',
      recommendation: 'Implement personalized upsell recommendations based on purchase history',
      gpt5Analysis: {
        reasoning: 'Based on customer behavior patterns and market trends',
        dataPoints: ['Purchase frequency increased 23%', 'Average cart value up 12%', 'Customer lifetime value improved'],
        predictedOutcome: 'Expected 15-20% revenue increase within 3 months'
      }
    },
    {
      id: '2',
      title: 'Customer Churn Risk',
      description: 'Early warning system detected 45 customers showing churn indicators',
      impact: 'high',
      confidence: 0.76,
      category: 'Retention',
      recommendation: 'Send personalized retention offers to at-risk customers',
      gpt5Analysis: {
        reasoning: 'Pattern recognition in customer engagement metrics',
        dataPoints: ['Login frequency decreased 40%', 'Support tickets increased 25%', 'Feature usage dropped'],
        predictedOutcome: 'Can reduce churn by 30% with immediate intervention'
      }
    },
    {
      id: '3',
      title: 'Market Trend Opportunity',
      description: 'AI detected emerging demand for sustainable products in your market',
      impact: 'medium',
      confidence: 0.68,
      category: 'Market',
      recommendation: 'Consider expanding product line to include eco-friendly options',
      gpt5Analysis: {
        reasoning: 'Cross-industry data analysis and consumer sentiment tracking',
        dataPoints: ['Competitor sustainability initiatives up 45%', 'Consumer surveys show 62% interest', 'Market research indicates 28% growth potential'],
        predictedOutcome: 'Potential market share increase of 12-15%'
      }
    }
  ];

  const mockReports: Report[] = [
    {
      id: '1',
      title: 'Q4 Performance Analysis',
      type: 'performance',
      status: 'ready',
      createdDate: '2024-01-15',
      data: {}
    },
    {
      id: '2',
      title: '2025 Revenue Forecast',
      type: 'forecast',
      status: 'ready',
      createdDate: '2024-01-12',
      data: {}
    }
  ];

  const mockStats: BusinessStats = {
    totalRevenue: 1850000,
    totalCustomers: 2847,
    averageOrderValue: 89.50,
    conversionRate: 3.2,
    customerRetention: 78.4,
    monthlyGrowth: 12.5,
    aiAccuracy: 0.87,
    insightsGenerated: 156
  };

  const { data: metrics = mockMetrics, isLoading: metricsLoading } = useQuery<BusinessMetric[]>({
    queryKey: ['/api/business/metrics'],
    refetchInterval: 30000,
  });

  const { data: insights = mockInsights, isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ['/api/business/insights'],
    refetchInterval: 30000,
  });

  const { data: reports = mockReports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/business/reports'],
    refetchInterval: 30000,
  });

  const { data: stats = mockStats, isLoading: statsLoading } = useQuery<BusinessStats>({
    queryKey: ['/api/business/stats'],
    refetchInterval: 30000,
  });

  const generateInsight = async (metric: BusinessMetric) => {
    setIsAnalyzing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Business Metric: ${metric.name}, Value: ${metric.value}, Change: ${metric.change}%, Trend: ${metric.trend}, Category: ${metric.category}`,
        'business-analysis'
      );
      console.log('Business insight generated:', result);
    } catch (error) {
      console.error('Failed to generate business insight:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="generate-report"
      onClick={() => setActiveTab('reports')}
      className="bg-green-600 hover:bg-green-700"
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      Generate Report
    </Button>,
    <Button
      key="ai-analysis"
      variant="outline"
      onClick={() => generateInsight(mockMetrics[0])}
      disabled={isAnalyzing}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isAnalyzing ? 'Analyzing...' : 'AI Business Insights'}
    </Button>
  ];

  const headerStats = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalCustomers}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Customers</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{Math.round(stats.conversionRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{stats.insightsGenerated}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">AI Insights</div>
      </div>
    </div>
  );

  const filteredMetrics = metrics.filter(metric => {
    if (categoryFilter !== 'all' && metric.category !== categoryFilter) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="AI Business Intelligence Dashboard"
      appDescription="Advanced business analytics with AI-powered insights, predictive modeling, and automated reporting for data-driven decision making"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Time Range and Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Time Range:</span>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMetrics.map(metric => (
              <GlassCard
                key={metric.id}
                className="p-6 cursor-pointer hover:border-blue-300"
                onClick={() => setSelectedMetric(metric)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.category}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {metric.period}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{metric.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {metric.category === 'revenue' ? '$' : ''}
                      {metric.value.toLocaleString()}
                      {metric.category === 'marketing' ? '%' : ''}
                    </span>
                    <span className={`text-sm font-medium ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Generated Business Insights ({insights.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {insights.map(insight => (
                  <GlassCard
                    key={insight.id}
                    className="p-4 cursor-pointer hover:border-purple-300"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Category: {insight.category}</span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Generated
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth Rate</span>
                    <span className="font-semibold text-green-600">+{stats.monthlyGrowth}%</span>
                  </div>
                  <Progress value={stats.monthlyGrowth} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Prediction Accuracy</span>
                    <span className="font-semibold">{Math.round(stats.aiAccuracy * 100)}%</span>
                  </div>
                  <Progress value={stats.aiAccuracy * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Retention Rate</span>
                    <span className="font-semibold">{stats.customerRetention}%</span>
                  </div>
                  <Progress value={stats.customerRetention} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Order Value</span>
                    <span className="font-semibold">${stats.averageOrderValue}</span>
                  </div>
                  <Progress value={(stats.averageOrderValue / 150) * 100} className="h-2" />
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Product Sales</span>
                    <span className="font-semibold">$1,250,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Services</span>
                    <span className="font-semibold">$425,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subscriptions</span>
                    <span className="font-semibold">$180,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other Revenue</span>
                    <span className="font-semibold">$95,000</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {reports.map(report => (
                  <GlassCard key={report.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          report.type === 'performance' ? 'bg-blue-100' :
                          report.type === 'forecast' ? 'bg-green-100' :
                          report.type === 'comparison' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {report.type} • Created {new Date(report.createdDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          report.status === 'ready' ? 'bg-green-100 text-green-800' :
                          report.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {report.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Business Intelligence Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Analysis Frequency</Label>
                  <Select value={analysisFrequency} onValueChange={setAnalysisFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Insight Threshold</Label>
                  <Select value={insightThreshold} onValueChange={setInsightThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (60% confidence)</SelectItem>
                      <SelectItem value="medium">Medium (75% confidence)</SelectItem>
                      <SelectItem value="high">High (90% confidence)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Sources</Label>
                  <Select value={dataSources} onValueChange={setDataSources}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="internal">Internal Only</SelectItem>
                      <SelectItem value="external">External Only</SelectItem>
                      <SelectItem value="custom">Custom Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Report Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interactive">Interactive Dashboard</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="email">Email Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Metric Details Modal */}
      {selectedMetric && (
        <Dialog open={!!selectedMetric} onOpenChange={() => setSelectedMetric(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Metric Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Metric Name</Label>
                  <div className="font-medium">{selectedMetric.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <Badge variant="outline">{selectedMetric.category}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value</Label>
                  <div className="font-medium text-lg">
                    {selectedMetric.category === 'revenue' ? '$' : ''}
                    {selectedMetric.value.toLocaleString()}
                    {selectedMetric.category === 'marketing' ? '%' : ''}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Change</Label>
                  <div className={`font-medium ${selectedMetric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMetric.change > 0 ? '+' : ''}{selectedMetric.change}%
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Trend Analysis</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTrendIcon(selectedMetric.trend)}
                    <span className="font-medium capitalize">{selectedMetric.trend} Trend</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This metric has shown {selectedMetric.trend === 'up' ? 'positive' : selectedMetric.trend === 'down' ? 'negative' : 'stable'} growth over the selected period.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Insight Details Modal */}
      {selectedInsight && (
        <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Insight Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</Label>
                  <div className="font-medium">{selectedInsight.title}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Impact Level</Label>
                  <Badge className={getImpactColor(selectedInsight.impact)}>
                    {selectedInsight.impact}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence</Label>
                  <div className="font-medium">{Math.round(selectedInsight.confidence * 100)}%</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <div className="font-medium">{selectedInsight.category}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</Label>
                <div className="text-sm text-gray-700 dark:text-gray-300">{selectedInsight.description}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recommendation</Label>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">{selectedInsight.recommendation}</div>
                </div>
              </div>

              {selectedInsight.gpt5Analysis && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Analysis Details
                  </Label>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Reasoning:</strong> {selectedInsight.gpt5Analysis.reasoning}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Data Points:</div>
                      <ul className="space-y-1">
                        {selectedInsight.gpt5Analysis.dataPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <strong>Predicted Outcome:</strong> {selectedInsight.gpt5Analysis.predictedOutcome}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}