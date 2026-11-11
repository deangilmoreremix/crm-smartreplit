import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Brain, TrendingUp, Target, Zap, Activity, BarChart3, DollarSign } from 'lucide-react';
import { gpt5Service } from '../../services/gpt5Service';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import AIStateNotice from './AIStateNotice';

interface AnalyticsInsight {
  title: string;
  insight: string;
  recommendations: string[];
}

interface BusinessIntelligence {
  growthOpportunities: unknown[];
  strategicRecommendations: unknown[];
}

const asText = (item: unknown, fallbackKeys: string[] = ['description', 'action']): string => {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    for (const k of fallbackKeys) {
      const v = (item as Record<string, unknown>)[k];
      if (typeof v === 'string') return v;
    }
  }
  return '';
};

const GPT5AnalyticsPanel: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { tasks } = useTaskStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsInsights, setAnalyticsInsights] = useState<AnalyticsInsight[]>([]);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence | null>(
    null
  );
  const [aiError, setAiError] = useState<unknown>(null);
  const [lastAnalysis, setLastAnalysis] = useState<string>('');
  const [retryTick, setRetryTick] = useState(0);

  // Real metrics computed from the stores
  const metrics = useMemo(() => {
    const dealsArray = Object.values(deals);
    const contactsArray = Object.values(contacts);
    const tasksArray = Object.values(tasks);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const isWon = (d: (typeof dealsArray)[number]) => d.stage?.id === 'closed-won';
    const isLost = (d: (typeof dealsArray)[number]) => d.stage?.id === 'closed-lost';
    const wonDeals = dealsArray.filter(isWon);
    const totalValue = dealsArray.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

    return {
      totalDeals: dealsArray.length,
      activeDeals: dealsArray.filter((d) => !isWon(d) && !isLost(d)).length,
      wonDeals: wonDeals.length,
      totalValue,
      avgDealSize: dealsArray.length > 0 ? totalValue / dealsArray.length : 0,
      winRate: dealsArray.length > 0 ? (wonDeals.length / dealsArray.length) * 100 : 0,
      totalContacts: contactsArray.length,
      activeContacts: contactsArray.filter(
        (c) =>
          c.status && typeof c.status === 'string' && ['hot', 'warm', 'active'].includes(c.status)
      ).length,
      topIndustries: contactsArray.reduce((acc: Record<string, number>, contact) => {
        if (!contact.industry) return acc;
        acc[contact.industry] = (acc[contact.industry] || 0) + 1;
        return acc;
      }, {}),
      totalTasks: tasksArray.length,
      completedTasks: tasksArray.filter((t) => t.status === 'completed').length,
      overdueTasks: tasksArray.filter((t) => {
        const dueDate = t.dueDate ? new Date(t.dueDate) : null;
        return dueDate && dueDate < now && t.status !== 'completed';
      }).length,
      newDeals30d: dealsArray.filter((d) => d.createdAt && new Date(d.createdAt) > thirtyDaysAgo)
        .length,
      salesVelocity: wonDeals.filter(
        (d) => d.actualCloseDate && new Date(d.actualCloseDate) > thirtyDaysAgo
      ).length,
    };
  }, [deals, contacts, tasks]);

  // Stable key so the analysis does not refire on every store reference change
  const signature = JSON.stringify([
    metrics.totalDeals,
    metrics.activeDeals,
    metrics.wonDeals,
    metrics.totalValue,
    metrics.totalContacts,
    metrics.totalTasks,
    metrics.completedTasks,
    metrics.overdueTasks,
  ]);

  useEffect(() => {
    if (metrics.totalDeals === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      const [kpi, bi] = await Promise.allSettled([
        gpt5Service.analyzeKPITrends({}, { current: metrics }, [], []),
        gpt5Service.generateBusinessIntelligence(
          { salesData: metrics, customerSegments: Object.keys(metrics.topIndustries) },
          {},
          []
        ),
      ]);
      if (cancelled) return;

      const insights: AnalyticsInsight[] = [];
      if (kpi.status === 'fulfilled' && typeof kpi.value?.summary === 'string') {
        insights.push({
          title: 'Pipeline Health Analysis',
          insight: kpi.value.summary,
          recommendations: Array.isArray(kpi.value.recommendations)
            ? kpi.value.recommendations.map((r: unknown) => asText(r)).filter(Boolean)
            : [],
        });
      }
      setAnalyticsInsights(insights);

      if (bi.status === 'fulfilled' && bi.value && typeof bi.value === 'object') {
        const growth = Array.isArray(bi.value.growth_opportunities)
          ? bi.value.growth_opportunities
          : [];
        const strategic = Array.isArray(bi.value.strategic_recommendations)
          ? bi.value.strategic_recommendations
          : [];
        setBusinessIntelligence(
          growth.length || strategic.length
            ? { growthOpportunities: growth, strategicRecommendations: strategic }
            : null
        );
      } else {
        setBusinessIntelligence(null);
      }

      const failure =
        kpi.status === 'rejected' ? kpi.reason : bi.status === 'rejected' ? bi.reason : null;
      setAiError(failure);
      if (!failure) setLastAnalysis(new Date().toLocaleTimeString());
      setIsAnalyzing(false);
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // metrics is derived from the same inputs captured by `signature`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, retryTick]);

  const card = `p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`;
  const label = `text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const val = `text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`;

  return (
    <div className="space-y-6">
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
                Advanced Analytics
              </h3>
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                Pipeline metrics with AI commentary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastAnalysis && (
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Last updated: {lastAnalysis}
              </span>
            )}
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

      {metrics.totalDeals === 0 && (
        <div data-testid="analytics-empty" className={`${label} text-center`}>
          No deals yet. Add deals to see analytics.
        </div>
      )}

      {aiError != null && (
        <AIStateNotice error={aiError} onRetry={() => setRetryTick((t) => t + 1)} />
      )}

      {/* Key metrics (real computed values) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <DollarSign className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <p className={label}>Pipeline Value</p>
              <p className={val}>${metrics.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Target className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className={label}>Win Rate</p>
              <p className={val}>{metrics.winRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <BarChart3 className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <p className={label}>Avg Deal Size</p>
              <p className={val}>${metrics.avgDealSize.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <Activity className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={label}>Deals won (30d)</p>
              <p className={val}>{metrics.salesVelocity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI insights: only what the model returned */}
      {analyticsInsights.length > 0 && (
        <div className="space-y-4">
          <h4
            className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <Brain className="h-4 w-4" />
            AI Strategic Insights
          </h4>
          <div className="grid gap-4">
            {analyticsInsights.map((insight, index) => (
              <div
                key={index}
                data-testid="analytics-insight"
                className={`p-4 rounded-lg border ${
                  isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                }`}
              >
                <h5 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {insight.title}
                </h5>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {insight.insight}
                </p>
                {insight.recommendations.length > 0 && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {businessIntelligence && (
        <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h4 className={`font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Strategic Business Intelligence
            </h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {(
              [
                ['Growth Opportunities', businessIntelligence.growthOpportunities],
                ['Strategic Recommendations', businessIntelligence.strategicRecommendations],
              ] as const
            ).map(([heading, items]) => (
              <div key={heading}>
                <h5
                  className={`font-medium mb-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}
                >
                  {heading}
                </h5>
                <ul className="space-y-1">
                  {items
                    .slice(0, 3)
                    .map((it) => asText(it))
                    .filter(Boolean)
                    .map((text, index) => (
                      <li
                        key={index}
                        className={`${isDark ? 'text-purple-100' : 'text-purple-700'} flex items-center gap-2`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-purple-300' : 'bg-purple-500'}`}
                        />
                        {text}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GPT5AnalyticsPanel;
