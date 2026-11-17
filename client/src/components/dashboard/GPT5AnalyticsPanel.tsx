import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  BarChart3,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';
import { generateAI } from '../../services/aiGenerate';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';

interface AnalyticsInsight {
  title: string;
  insight: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations?: string[];
}

interface BusinessIntelligence {
  growthOpportunities: string[];
  strategicRecommendations: string[];
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['insights', 'growthOpportunities', 'strategicRecommendations'],
  properties: {
    insights: {
      type: 'array',
      description: 'Up to 4 insights, each grounded in the metrics provided',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'insight', 'confidence', 'priority', 'recommendations'],
        properties: {
          title: { type: 'string' },
          insight: { type: 'string', description: 'What the numbers show; cite the provided metrics' },
          confidence: { type: 'number', description: 'Your confidence from 0 to 1 given how much data was provided' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    growthOpportunities: { type: 'array', items: { type: 'string' } },
    strategicRecommendations: { type: 'array', items: { type: 'string' } },
  },
} as const;

const GPT5AnalyticsPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { tasks } = useTaskStore();

  // GPT-5 Enhanced State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsInsights, setAnalyticsInsights] = useState<AnalyticsInsight[]>([]);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence | null>(
    null
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string>('');

  // Calculate comprehensive metrics
  const calculateAdvancedMetrics = () => {
    const dealsArray = Object.values(deals);
    const contactsArray = Object.values(contacts);
    const tasksArray = Object.values(tasks);

    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      // Deal Metrics
      totalDeals: dealsArray.length,
      activeDeals: dealsArray.filter(
        (d) =>
          d.stage &&
          typeof d.stage === 'string' &&
          !['Won', 'Lost', 'won', 'lost', 'closed-won', 'closed-lost'].includes(d.stage)
      ).length,
      wonDeals: dealsArray.filter(
        (d) =>
          d.stage && typeof d.stage === 'string' && ['Won', 'won', 'closed-won'].includes(d.stage)
      ).length,
      totalValue: dealsArray.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      avgDealSize:
        dealsArray.length > 0
          ? dealsArray.reduce((sum, deal) => sum + Number(deal.value || 0), 0) / dealsArray.length
          : 0,
      winRate:
        dealsArray.length > 0
          ? (dealsArray.filter(
              (d) =>
                d.stage &&
                typeof d.stage === 'string' &&
                ['Won', 'won', 'closed-won'].includes(d.stage)
            ).length /
              dealsArray.length) *
            100
          : 0,

      // Contact Metrics
      totalContacts: contactsArray.length,
      activeContacts: contactsArray.filter(
        (c) =>
          c.status && typeof c.status === 'string' && ['hot', 'warm', 'active'].includes(c.status)
      ).length,
      topIndustries: contactsArray.reduce((acc: any, contact) => {
        const industry = contact.industry || 'Unknown';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {}),

      // Task Metrics
      totalTasks: tasksArray.length,
      completedTasks: tasksArray.filter((t) => t.status === 'completed').length,
      overdueTasks: tasksArray.filter((t) => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < currentDate && t.status !== 'completed';
      }).length,

      // Time-based Analytics
      recentDeals: dealsArray.filter((d) => d.createdAt && new Date(d.createdAt) > thirtyDaysAgo),
      salesVelocity: dealsArray.filter(
        (d) =>
          d.stage &&
          typeof d.stage === 'string' &&
          ['Won', 'won', 'closed-won'].includes(d.stage) &&
          d.actualCloseDate &&
          new Date(d.actualCloseDate) > thirtyDaysAgo
      ).length,
    };
  };

  // AI analysis of the real CRM metrics (POST /api/ai/generate with the user's own key)
  const runGPT5Analysis = async () => {
    if (Object.keys(deals).length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const { recentDeals, topIndustries, ...rest } = calculateAdvancedMetrics();
      const result = await generateAI({
        system:
          'You are a sales analyst. Use only the CRM metrics provided. Do not invent numbers, benchmarks or trends that are not in the data; if the data is too thin for an insight, say so.',
        prompt: `CRM metrics: ${JSON.stringify({ ...rest, dealsCreatedLast30Days: recentDeals.length, contactsByIndustry: topIndustries })}`,
        schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
        schemaName: 'crm_analytics',
        tier: 'advanced',
      });
      const data = result.data;
      if (!data || !Array.isArray(data.insights)) throw new Error('The AI response had no insights');

      setAnalyticsInsights(
        data.insights.map((i: any) => ({
          title: String(i.title || ''),
          insight: String(i.insight || ''),
          confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0)),
          priority: ['high', 'medium', 'low'].includes(i.priority) ? i.priority : 'medium',
          actionable: true,
          recommendations: Array.isArray(i.recommendations) ? i.recommendations.map(String) : [],
        }))
      );
      setBusinessIntelligence({
        growthOpportunities: Array.isArray(data.growthOpportunities) ? data.growthOpportunities.map(String) : [],
        strategicRecommendations: Array.isArray(data.strategicRecommendations)
          ? data.strategicRecommendations.map(String)
          : [],
      });
      setLastAnalysis(new Date().toLocaleTimeString());
    } catch (error) {
      setAnalyticsInsights([]);
      setBusinessIntelligence(null);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const metrics = calculateAdvancedMetrics();

  return (
    <div className="space-y-6">
      {/* GPT-5 Analytics Header */}
      <div
        className={`p-4 rounded-xl ${
          isDark
            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10'
            : 'bg-gradient-to-r from-blue-50 to-purple-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Brain className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                GPT-5 Advanced Analytics
              </h3>
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                Expert-level business intelligence and forecasting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastAnalysis && (
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Last updated: {lastAnalysis}
              </span>
            )}

            <button
              type="button"
              onClick={runGPT5Analysis}
              disabled={isAnalyzing || Object.keys(deals).length === 0}
              className={`px-3 py-1 rounded-md text-sm ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-600 text-white'} disabled:opacity-50`}
            >
              Run analysis
            </button>

            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin">
                  <Zap className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                </div>
                <span className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  Analyzing...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <DollarSign className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pipeline Value
              </p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${metrics.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Target className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Win Rate</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metrics.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <BarChart3 className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Deal Size
              </p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${metrics.avgDealSize.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <Activity className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sales Velocity
              </p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metrics.salesVelocity}/month
              </p>
            </div>
          </div>
        </div>
      </div>

      {analysisError && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-sm ${isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700'}`}
        >
          {analysisError}
        </div>
      )}

      {/* GPT-5 Insights */}
      {analyticsInsights.length > 0 && (
        <div className="space-y-4">
          <h4
            className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <Brain className="h-4 w-4" />
            GPT-5 Strategic Insights
          </h4>

          <div className="grid gap-4">
            {analyticsInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {insight.title}
                      </h5>
                      <div
                        className={`px-2 py-1 rounded-full text-xs ${
                          insight.priority === 'high'
                            ? isDark
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-red-100 text-red-600'
                            : insight.priority === 'medium'
                              ? isDark
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-yellow-100 text-yellow-600'
                              : isDark
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {insight.priority} priority
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs ${
                          isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {Math.round(insight.confidence * 100)}% confidence
                      </div>
                    </div>

                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {insight.insight}
                    </p>

                    {insight.recommendations &&
                      Array.isArray(insight.recommendations) &&
                      insight.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <p
                            className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Recommendations:
                          </p>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec, recIndex) => (
                              <li
                                key={recIndex}
                                className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}
                                />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Intelligence Panel */}
      {businessIntelligence && (
        <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h4 className={`font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Strategic Business Intelligence
            </h4>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className={`font-medium mb-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                Growth Opportunities
              </h5>
              <ul className="space-y-1">
                {Array.isArray(businessIntelligence.growthOpportunities) &&
                  businessIntelligence.growthOpportunities.slice(0, 3).map((opp, index) => (
                    <li
                      key={index}
                      className={`${isDark ? 'text-purple-100' : 'text-purple-700'} flex items-center gap-2`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-purple-300' : 'bg-purple-500'}`}
                      />
                      {opp}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h5 className={`font-medium mb-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                Strategic Recommendations
              </h5>
              <ul className="space-y-1">
                {Array.isArray(businessIntelligence.strategicRecommendations) &&
                  businessIntelligence.strategicRecommendations.slice(0, 3).map((rec, index) => (
                    <li
                      key={index}
                      className={`${isDark ? 'text-purple-100' : 'text-purple-700'} flex items-center gap-2`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-purple-300' : 'bg-purple-500'}`}
                      />
                      {rec}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPT5AnalyticsPanel;
