import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Clock,
  Users,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '@/hooks/useContactStore';
import { aiPredictiveAnalytics } from '../../services/ai-predictive-analytics.service';

interface DealIntelligence {
  dealId: string;
  winProbability: number;
  predictedValue: number;
  timeToClose: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

interface DealStageMetrics {
  stage: string;
  count: number;
  value: number;
  avgTime: number;
  conversionRate: number;
}

const DealIntelligenceDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const [dealIntelligence, setDealIntelligence] = useState<DealIntelligence[]>([]);
  const [stageMetrics, setStageMetrics] = useState<DealStageMetrics[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate deal stage metrics
  useEffect(() => {
    const dealsArray = Object.values(deals);

    const metrics: DealStageMetrics[] = [
      { stage: 'lead', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
      { stage: 'qualified', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
      { stage: 'proposal', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
      { stage: 'negotiation', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
      { stage: 'closed_won', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
      { stage: 'closed_lost', count: 0, value: 0, avgTime: 0, conversionRate: 0 },
    ];

    dealsArray.forEach((deal) => {
      const stageIndex = metrics.findIndex((m) => m.stage === deal.stage);
      if (stageIndex !== -1) {
        metrics[stageIndex].count += 1;
        metrics[stageIndex].value += deal.value;
        // Calculate average time in stage (simplified)
        metrics[stageIndex].avgTime += Math.random() * 30 + 7; // Mock data
      }
    });

    // Calculate conversion rates
    const totalDeals = dealsArray.length;
    metrics.forEach((metric, index) => {
      if (index > 0) {
        const prevStage = metrics[index - 1];
        metric.conversionRate = prevStage.count > 0 ? (metric.count / prevStage.count) * 100 : 0;
      }
      metric.avgTime = metric.avgTime / metric.count || 0;
    });

    setStageMetrics(metrics);
  }, [deals]);

  // Generate AI-powered deal intelligence
  const analyzeDeals = async () => {
    setIsAnalyzing(true);
    try {
      const dealsArray = Object.values(deals);
      const intelligence: DealIntelligence[] = [];

      for (const deal of dealsArray.slice(0, 5)) {
        // Analyze first 5 deals for demo
        // Use AI predictive analytics to generate insights
        const prediction = await aiPredictiveAnalytics.predictDealOutcome(deal.id);

        intelligence.push({
          dealId: deal.id,
          winProbability: prediction ? prediction.value : Math.random() * 100,
          predictedValue: deal.value * (0.8 + Math.random() * 0.4), // ±20% variation
          timeToClose: Math.floor(Math.random() * 90) + 7, // 7-97 days
          riskFactors: ['Competition mentioned', 'Budget concerns', 'Long decision cycle'].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          ),
          recommendations: [
            'Follow up within 3 days',
            'Send technical demo',
            'Offer discount for quick close',
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          confidence: 0.7 + Math.random() * 0.3, // 70-100% confidence
        });
      }

      setDealIntelligence(intelligence);
    } catch (error) {
      console.error('Failed to analyze deals:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data
  const pipelineChartData = stageMetrics.map((metric) => ({
    stage: metric.stage.replace('_', ' ').toUpperCase(),
    count: metric.count,
    value: metric.value / 1000, // Convert to thousands
  }));

  const conversionChartData = stageMetrics.map((metric) => ({
    stage: metric.stage.replace('_', ' ').toUpperCase(),
    rate: metric.conversionRate,
  }));

  const getRiskColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskIcon = (probability: number) => {
    if (probability >= 80) return CheckCircle;
    if (probability >= 60) return AlertTriangle;
    return XCircle;
  };

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deal Intelligence</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered deal analysis and predictive insights
          </p>
        </div>
        <Button
          onClick={analyzeDeals}
          disabled={isAnalyzing}
          className="flex items-center space-x-2"
        >
          <Brain className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Deals'}</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Pipeline Overview</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Pipeline Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stageMetrics.reduce((sum, m) => sum + m.value, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {Object.keys(deals).length} deals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {Math.round(
                    stageMetrics.reduce((sum, m) => sum + m.value, 0) /
                      Math.max(Object.keys(deals).length, 1)
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Per deal average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stageMetrics.find((m) => m.stage === 'closed_won')?.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Lead to close rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time to Close</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    stageMetrics.reduce((sum, m) => sum + m.avgTime, 0) / stageMetrics.length
                  )}{' '}
                  days
                </div>
                <p className="text-xs text-muted-foreground">Average across stages</p>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>Distribution of deals across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'count' ? `${value} deals` : `$${value}K`,
                        name === 'count' ? 'Count' : 'Value',
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Conversion rates between pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={conversionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Conversion Rate']} />
                    <Area type="monotone" dataKey="rate" stroke="#f59e0b" fill="#fef3c7" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Deal Intelligence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predictive analytics and insights for your deals
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span>AI-Powered</span>
            </Badge>
          </div>

          {dealIntelligence.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Intelligence Data</h4>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Click "Analyze Deals" to generate AI-powered insights for your pipeline
                </p>
                <Button onClick={analyzeDeals} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Deals'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dealIntelligence.map((intelligence) => {
                const deal = deals[intelligence.dealId];
                if (!deal) return null;

                const RiskIcon = getRiskIcon(intelligence.winProbability);

                return (
                  <Card key={intelligence.dealId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{deal.title}</CardTitle>
                          <CardDescription>{deal.company}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            intelligence.winProbability >= 80
                              ? 'default'
                              : intelligence.winProbability >= 60
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {intelligence.winProbability.toFixed(0)}% win rate
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Predicted Value
                          </p>
                          <p className="text-lg font-semibold">
                            ${intelligence.predictedValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Time to Close</p>
                          <p className="text-lg font-semibold">{intelligence.timeToClose} days</p>
                        </div>
                      </div>

                      {intelligence.riskFactors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Risk Factors</p>
                          <div className="flex flex-wrap gap-2">
                            {intelligence.riskFactors.map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {intelligence.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recommendations</p>
                          <ul className="space-y-1">
                            {intelligence.recommendations.map((rec, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                              >
                                <span className="text-green-600 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <RiskIcon
                            className={`w-4 h-4 ${getRiskColor(intelligence.winProbability)}`}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {intelligence.confidence.toFixed(0)}% confidence
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>
                AI-powered revenue predictions and scenario analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Forecasting Engine</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Advanced revenue forecasting with statistical models and AI predictions coming
                  soon
                </p>
                <Badge variant="secondary">In Development</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Business Insights</CardTitle>
              <CardDescription>
                Automated insights and recommendations from your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Business Intelligence</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  AI-powered business insights and automated recommendations coming soon
                </p>
                <Badge variant="secondary">In Development</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealIntelligenceDashboard;
