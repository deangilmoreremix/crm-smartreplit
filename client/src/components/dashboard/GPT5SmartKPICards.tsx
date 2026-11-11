import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Brain, DollarSign, Target, Award, BarChart3, Sparkles, Zap } from 'lucide-react';
import { gpt5Service } from '../../services/gpt5Service';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import AIStateNotice from './AIStateNotice';

interface SmartKPIMetric {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface AIKpiResult {
  summary?: string;
  recommendations: string[];
}

const GPT5SmartKPICards: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const [aiResult, setAiResult] = useState<AIKpiResult | null>(null);
  const [aiError, setAiError] = useState<unknown>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [retryTick, setRetryTick] = useState(0);

  // Real metrics computed from the stores
  const base = useMemo(() => {
    const dealsArray = deals;
    const contactsCount = Object.keys(contacts || {}).length;
    const totalPipelineValue = dealsArray.reduce(
      (sum: number, deal) => sum + Number(deal.value || 0),
      0
    );
    const activeDeals = dealsArray.filter(
      (d) => d.stage.id !== 'closed-won' && d.stage.id !== 'closed-lost'
    );
    const wonDeals = dealsArray.filter((d) => d.stage.id === 'closed-won');
    const winRate = dealsArray.length > 0 ? (wonDeals.length / dealsArray.length) * 100 : 0;
    const avgDealSize = activeDeals.length > 0 ? totalPipelineValue / activeDeals.length : 0;
    return {
      dealsCount: dealsArray.length,
      contactsCount,
      totalPipelineValue,
      activeCount: activeDeals.length,
      wonCount: wonDeals.length,
      winRate,
      avgDealSize,
    };
  }, [deals, contacts]);

  const metrics: SmartKPIMetric[] = [
    {
      title: 'Pipeline Value',
      value: `$${base.totalPipelineValue.toLocaleString()}`,
      icon: DollarSign,
      description: 'Total pipeline value',
    },
    {
      title: 'Win Rate',
      value: `${base.winRate.toFixed(1)}%`,
      icon: Target,
      description: 'Won deals / all deals',
    },
    {
      title: 'Avg Deal Size',
      value: `$${base.avgDealSize.toLocaleString()}`,
      icon: BarChart3,
      description: 'Average value of active deals',
    },
    {
      title: 'Active Deals',
      value: base.activeCount.toString(),
      icon: Award,
      description: 'Deals in active stages',
    },
  ];

  // Stable key: re-analyse only when the numbers change, not on every store tick
  const signature = [
    base.dealsCount,
    base.contactsCount,
    base.totalPipelineValue,
    base.wonCount,
    base.activeCount,
  ].join('|');

  useEffect(() => {
    if (base.dealsCount === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        // No history is sent: we do not invent a previous period.
        const result = await gpt5Service.analyzeKPITrends(
          {},
          {
            current_pipeline_value: base.totalPipelineValue,
            current_win_rate: base.winRate,
            current_deals: base.dealsCount,
            active_deals: base.activeCount,
            active_contacts: base.contactsCount,
          }
        );
        if (cancelled) return;
        setAiResult({
          summary: typeof result?.summary === 'string' ? result.summary : undefined,
          recommendations: Array.isArray(result?.recommendations)
            ? result.recommendations.filter((r: unknown) => typeof r === 'string')
            : [],
        });
        setAiError(null);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        if (cancelled) return;
        setAiResult(null);
        setAiError(error);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // base is derived from the same inputs captured by `signature`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, retryTick]);

  if (base.dealsCount === 0) {
    return (
      <div
        data-testid="kpi-empty"
        className={`p-6 rounded-xl text-center text-sm ${
          isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'
        }`}
      >
        No deals yet. Add a deal to see your KPIs and AI analysis.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Brain className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Smart KPI Analysis
            </h3>
            <div className="flex items-center gap-2">
              <Sparkles className={`h-3 w-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <span className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                Live KPIs with AI commentary
              </span>
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <Zap className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Analyzing...
            </span>
          </div>
        )}

        {lastUpdate && !aiError && (
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Updated: {lastUpdate}
          </span>
        )}
      </div>

      {aiError != null && (
        <AIStateNotice error={aiError} onRetry={() => setRetryTick((t) => t + 1)} />
      )}

      {/* KPI Cards (real computed values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className={`group p-4 rounded-xl transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:shadow-xl'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  {metric.title}
                </span>
                <div
                  className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {metric.value}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <metric.icon className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* AI commentary: only what the model actually returned */}
      {aiResult && (aiResult.summary || aiResult.recommendations.length > 0) && (
        <div
          data-testid="kpi-ai-insight"
          className={`p-3 rounded-lg text-xs ${
            isDark ? 'bg-blue-500/10 text-blue-200' : 'bg-blue-50 text-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 mb-1 font-medium">
            <Brain className="h-3 w-3" />
            AI Insight
          </div>
          {aiResult.summary && <p>{aiResult.summary}</p>}
          {aiResult.recommendations.length > 0 && (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {aiResult.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default GPT5SmartKPICards;
