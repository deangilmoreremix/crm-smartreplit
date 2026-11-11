import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Target, Brain, Clock, Zap } from 'lucide-react';
import { gpt5Service } from '../../services/gpt5Service';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import AIStateNotice from './AIStateNotice';

interface DealIntelligence {
  dealId: string;
  dealTitle: string;
  error?: unknown;
  /** True when the AI response lacked some fields and values shown are partial. */
  isEstimate: boolean;
  winProbability?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  keyFactors: string[];
  recommendations: string[];
  expectedOutcome?: string;
  confidence?: number;
  timeToClose?: number;
  valueOptimization?: number;
}

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const GPT5DealIntelligence: React.FC = () => {
  const { isDark } = useTheme();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const [dealIntelligence, setDealIntelligence] = useState<DealIntelligence[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [topError, setTopError] = useState<unknown>(null);
  const [retryTick, setRetryTick] = useState(0);

  // Active deals; the contact is optional context
  const activeDeals = useMemo(
    () =>
      Object.values(deals)
        .filter((deal) => deal.stage?.id !== 'closed-won' && deal.stage?.id !== 'closed-lost')
        .map((deal) => ({ ...deal, contact: contacts[deal.contactId] })),
    [deals, contacts]
  );

  const signature = JSON.stringify(
    activeDeals.slice(0, 5).map((d) => [d.id, d.value, d.stage?.id, d.probability, !!d.contact])
  );

  useEffect(() => {
    if (activeDeals.length === 0) {
      setDealIntelligence([]);
      setTopError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      const results = await Promise.all(
        activeDeals.slice(0, 5).map(async (deal): Promise<DealIntelligence> => {
          const base = { dealId: String(deal.id), dealTitle: deal.title };
          const dealData = {
            id: deal.id,
            title: deal.title,
            value: deal.value,
            stage: deal.stage?.id,
            probability: deal.probability,
            expectedCloseDate: deal.expectedCloseDate,
            description: deal.description,
          };
          const contactHistory = deal.contact
            ? {
                contact: deal.contact,
                industry: deal.contact.industry,
                company: deal.contact.company,
                position: deal.contact.position,
              }
            : {};
          const marketContext = { dealSize: deal.value, industry: deal.contact?.industry };

          try {
            const a = await gpt5Service.analyzeDealIntelligence(
              dealData,
              contactHistory,
              marketContext
            );
            const risk = typeof a.risk_level === 'string' ? a.risk_level.toLowerCase() : '';
            const keyFactors = strings(a.key_factors);
            const recommendations = strings(a.recommendations);
            const winProbability = num(a.probability_score);
            const timeToClose = num(a.estimated_close_days);
            const confidence =
              a.confidence_level === 'high'
                ? 0.9
                : a.confidence_level === 'medium'
                  ? 0.7
                  : a.confidence_level === 'low'
                    ? 0.5
                    : undefined;
            const complete =
              winProbability !== undefined &&
              RISK_LEVELS.includes(risk) &&
              keyFactors.length > 0 &&
              recommendations.length > 0 &&
              timeToClose !== undefined &&
              confidence !== undefined;
            return {
              ...base,
              isEstimate: !complete,
              winProbability,
              riskLevel: RISK_LEVELS.includes(risk) ? (risk as DealIntelligence['riskLevel']) : undefined,
              keyFactors,
              recommendations,
              expectedOutcome: typeof a.expected_outcome === 'string' ? a.expected_outcome : undefined,
              confidence,
              timeToClose,
              valueOptimization: num(a.value_optimization),
            };
          } catch (error) {
            return { ...base, isEstimate: true, keyFactors: [], recommendations: [], error };
          }
        })
      );
      if (cancelled) return;
      setDealIntelligence(results);
      const allFailed = results.length > 0 && results.every((r) => r.error);
      setTopError(allFailed ? results[0].error : null);
      setIsAnalyzing(false);
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // activeDeals is derived from the same inputs captured by `signature`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, retryTick]);

  const analyzed = dealIntelligence.filter((d) => !d.error);
  const overall = [
    {
      title: 'High-Probability Deals',
      description: `${analyzed.filter((d) => (d.winProbability ?? 0) > 70).length} of ${analyzed.length} analyzed deals have AI win probability above 70%`,
    },
    {
      title: 'High-Risk Deals',
      description: `${analyzed.filter((d) => d.riskLevel === 'high' || d.riskLevel === 'critical').length} analyzed deals flagged high risk`,
    },
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return isDark ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100';
      case 'high':
        return isDark ? 'text-orange-400 bg-orange-500/20' : 'text-orange-600 bg-orange-100';
      case 'medium':
        return isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-100';
      case 'low':
        return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100';
      default:
        return isDark ? 'text-gray-400 bg-gray-500/20' : 'text-gray-600 bg-gray-100';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return isDark ? 'text-green-400' : 'text-green-600';
    if (probability >= 60) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (probability >= 40) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const muted = isDark ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="space-y-6">
      <div
        className={`p-4 rounded-xl border ${
          isDark
            ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
            : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
              <Target className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Deal Intelligence
              </h3>
              <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                AI deal analysis and win probability
              </p>
            </div>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div className="animate-spin">
                <Brain className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <span className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Analyzing deals...
              </span>
            </div>
          )}
        </div>
      </div>

      {topError != null && (
        <AIStateNotice error={topError} onRetry={() => setRetryTick((t) => t + 1)} />
      )}

      {analyzed.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {overall.map((insight) => (
            <div
              key={insight.title}
              className={`p-4 rounded-lg border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
              }`}
            >
              <h4 className={`font-medium text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {insight.title}
              </h4>
              <p className={`text-xs ${muted}`}>{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h4
          className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          <Brain className="h-4 w-4" />
          Individual Deal Analysis
        </h4>

        <div className="grid gap-4">
          {dealIntelligence.map((intelligence) => (
            <div
              key={intelligence.dealId}
              data-testid="deal-intel-card"
              className={`p-4 rounded-lg border ${
                isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
              } hover:shadow-lg transition-shadow cursor-pointer`}
              onClick={() =>
                setSelectedDeal(selectedDeal === intelligence.dealId ? null : intelligence.dealId)
              }
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {intelligence.dealTitle}
                    </h5>
                    {intelligence.riskLevel && (
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(intelligence.riskLevel)}`}
                      >
                        {intelligence.riskLevel} risk
                      </div>
                    )}
                    {!intelligence.error && intelligence.isEstimate && (
                      <div
                        data-testid="estimate-badge"
                        className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-500"
                      >
                        Estimate
                      </div>
                    )}
                  </div>

                  {intelligence.error != null ? (
                    <AIStateNotice error={intelligence.error} />
                  ) : (
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      {intelligence.winProbability !== undefined && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span
                            className={`font-medium ${getProbabilityColor(intelligence.winProbability)}`}
                          >
                            {intelligence.winProbability}% win probability
                          </span>
                        </div>
                      )}
                      {intelligence.timeToClose !== undefined && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={muted}>{intelligence.timeToClose} days to close</span>
                        </div>
                      )}
                      {intelligence.confidence !== undefined && (
                        <div className="flex items-center gap-1">
                          <Zap
                            className={`h-3 w-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}
                          />
                          <span className={muted}>
                            {Math.round(intelligence.confidence * 100)}% confidence
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!!intelligence.valueOptimization && (
                  <div className="text-right">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Optimization Potential
                    </div>
                    <div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      +${intelligence.valueOptimization.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedDeal === intelligence.dealId && !intelligence.error && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                  {intelligence.keyFactors.length > 0 && (
                    <div>
                      <h6
                        className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Key Factors
                      </h6>
                      <ul className="space-y-1">
                        {intelligence.keyFactors.map((factor, index) => (
                          <li key={index} className={`text-xs ${muted}`}>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {intelligence.recommendations.length > 0 && (
                    <div>
                      <h6
                        className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        AI Recommendations
                      </h6>
                      <ul className="space-y-1">
                        {intelligence.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className={`text-xs ${isDark ? 'text-green-300' : 'text-green-600'}`}
                          >
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {intelligence.expectedOutcome && (
                    <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                      {intelligence.expectedOutcome}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {dealIntelligence.length === 0 && !isAnalyzing && (
          <div
            data-testid="deal-intel-empty"
            className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active deals to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPT5DealIntelligence;
