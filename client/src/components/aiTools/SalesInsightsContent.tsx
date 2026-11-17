import React, { useState } from 'react';
import * as edgeFunctionService from '../../services/edgeFunctionService';
import StructuredAIResult from '../shared/StructuredAIResult';
import { useContactStore } from '../../hooks/useContactStore';
import { useDealStore } from '../../store/dealStore';
import {
  Brain,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
  AlertTriangle,
  DollarSign,
  Users,
} from 'lucide-react';

const MAX_ITEMS = 50;

const toTime = (v: any) => {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

const stageName = (stage: any): string =>
  typeof stage === 'string' ? stage : (stage?.name ?? stage?.id ?? 'unknown');

const stageKey = (stage: any): string => stageName(stage).toLowerCase().replace(/[\s_]/g, '-');

const SalesInsightsContent: React.FC = () => {
  const { contacts: contactsRaw } = useContactStore();
  const { deals: dealsRaw } = useDealStore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDataDetails, setShowDataDetails] = useState(false);

  // The user's real records, most recently updated first, capped to keep the AI payload small
  const allContacts = Object.values(contactsRaw || {}) as any[];
  const allDeals = Object.values(dealsRaw || {}) as any[];
  const contacts = [...allContacts]
    .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt))
    .slice(0, MAX_ITEMS)
    .map((c) => ({
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      company: c.company || '',
      status: c.status,
      score: c.score ?? c.aiScore,
    }));
  const deals = [...allDeals]
    .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt))
    .slice(0, MAX_ITEMS)
    .map((d) => ({
      title: d.title,
      value: Number(d.value) || 0,
      stage: stageName(d.stage),
      probability: d.probability,
    }));

  const hasData = contacts.length > 0 || deals.length > 0;
  const pipelineValue = allDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const scores = allContacts.map((c) => c.score ?? c.aiScore).filter((n) => typeof n === 'number');
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const won = allDeals.filter((d) => stageKey(d.stage) === 'closed-won').length;
  const lost = allDeals.filter((d) => stageKey(d.stage) === 'closed-lost').length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  const handleGenerateInsights = async () => {
    if (!hasData) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await edgeFunctionService.generateSalesInsights(contacts, deals);
      setResult(result);
    } catch (err) {
      console.error('Error generating sales insights:', err);
      setError(
        err instanceof Error ? err.message : 'An error occurred while generating sales insights'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <BarChart3 className="text-green-600 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">AI Pipeline Intelligence</h3>
            <p className="text-green-700">
              Generate comprehensive insights and strategic recommendations based on your CRM data
              to optimize sales performance and identify growth opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          Sales Intelligence Analysis
        </h2>

        <p className="text-gray-600 mb-6">
          The AI analyzes your contacts, deals, and pipeline activities to identify patterns,
          opportunities, and provide actionable recommendations for improved sales performance.
        </p>

        {/* Data Overview */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Current Data Analysis
            </h4>
            <button
              onClick={() => setShowDataDetails(!showDataDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              {showDataDetails ? 'Hide' : 'Show'} Details
              {showDataDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Contacts</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">{allContacts.length}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Pipeline Value</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">${pipelineValue.toLocaleString()}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Avg Score</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">{avgScore ?? 'N/A'}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Win Rate</span>
              </div>
              <div className="text-xl font-semibold text-gray-900">{winRate !== null ? `${winRate}%` : 'N/A'}</div>
            </div>
          </div>

          {showDataDetails && (
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h5 className="font-medium text-gray-700 mb-2">Contacts ({contacts.length})</h5>
                <div className="space-y-1">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex justify-between p-2 bg-white rounded border">
                      <span>
                        {c.name}
                        {c.company ? ` (${c.company})` : ''}
                      </span>
                      {typeof c.score === 'number' && (
                        <span className="text-blue-600 font-medium">Score: {c.score}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-gray-700 mb-2">Pipeline Deals ({deals.length})</h5>
                <div className="space-y-1">
                  {deals.map((d, i) => (
                    <div key={i} className="p-2 bg-white rounded border">
                      <div className="flex justify-between">
                        <span className="font-medium">{d.title}</span>
                        <span className="text-green-600">${d.value.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {d.stage}
                        {typeof d.probability === 'number' ? ` • ${d.probability}% probability` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!hasData && (
          <p className="text-sm text-gray-500 mb-4">
            No contacts or deals yet. Add some to your CRM to generate pipeline insights.
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateInsights}
          disabled={isLoading || !hasData}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Analyzing pipeline data...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Generate AI Pipeline Intelligence
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Analysis Error</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && <StructuredAIResult data={result} title="Sales Pipeline Intelligence Report" />}
    </div>
  );
};

export default SalesInsightsContent;
