import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Zap, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAITools, type AIToolType } from '../../components/AIToolsProvider';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { openAIService } from '../../services/openAIService';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

export interface Insight {
  type: 'success' | 'warning' | 'insight';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  relatedContacts?: Array<{ id: string; name: string; avatar?: string }>;
}

type InsightType = Insight['type'];

const TOOL_FOR_TYPE: Record<InsightType, AIToolType> = {
  success: 'sales-insights',
  warning: 'live-deal-analysis',
  insight: 'sales-forecast',
};

const isClosed = (stageId?: string) => stageId === 'closed-won' || stageId === 'closed-lost';

const extractJson = (text: string): any => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('AI response was not valid JSON');
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const AIInsightsPanel = () => {
  const { isDark } = useTheme();
  const { openTool } = useAITools();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();

  const dealsArray = Object.values(deals);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<Array<Omit<Insight, 'icon' | 'color' | 'bgColor'>>>(
    []
  );

  const styleFor = (type: InsightType) =>
    type === 'success'
      ? {
          icon: CheckCircle,
          color: isDark ? 'text-green-400' : 'text-green-600',
          bgColor: isDark ? 'bg-green-500/20' : 'bg-green-100',
        }
      : type === 'warning'
        ? {
            icon: AlertTriangle,
            color: isDark ? 'text-orange-400' : 'text-orange-600',
            bgColor: isDark ? 'bg-orange-500/20' : 'bg-orange-100',
          }
        : {
            icon: TrendingUp,
            color: isDark ? 'text-blue-400' : 'text-blue-600',
            bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
          };

  const toRelated = (list: typeof dealsArray) =>
    list
      .map((deal) => {
        const contact = contacts[deal.contactId];
        return contact ? { id: contact.id, name: contact.name, avatar: contact.avatar } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; avatar?: string }>;


  // Counts computed from the real deals; refreshed whenever deals/contacts/theme change.
  const insights: Insight[] = useMemo(() => {
    const active = dealsArray.filter((deal) => !isClosed(deal.stage?.id));
    const highValue = active.filter((deal) => deal.value > 50000);
    const stalled = active.filter((deal) => deal.daysInStage && deal.daysInStage > 10);
    const highProb = active.filter((deal) => deal.probability > 70);
    const activeValue = active.reduce((sum, d) => sum + Number(d.value || 0), 0);

    return [
      {
        type: 'success',
        title: 'Pipeline Overview',
        description: `${active.length} active deals worth $${activeValue.toLocaleString()}; ${highValue.length} above $50,000.`,
        ...styleFor('success'),
        relatedContacts: toRelated(highValue),
      },
      {
        type: 'warning',
        title: 'Stalled Deals',
        description: `${stalled.length} active deals have been in their stage for more than 10 days.`,
        ...styleFor('warning'),
        relatedContacts: toRelated(stalled),
      },
      {
        type: 'insight',
        title: 'High-Probability Deals',
        description: `${highProb.length} active deals have a probability above 70%.`,
        ...styleFor('insight'),
        relatedContacts: toRelated(highProb),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, contacts, isDark]);

  // AI results describe the deals they were generated from; drop them when the deals change.
  const dealsSignature = dealsArray.map((d) => `${d.id}:${d.stage?.id}:${d.value}`).join('|');
  useEffect(() => {
    setAiInsights([]);
  }, [dealsSignature]);

  const generateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await generateRealInsights();
    } catch (err) {
      console.error('Failed to generate insights:', err);
      const message = err instanceof Error ? err.message : '';
      setAiInsights([]);
      setError(
        /api key/i.test(message)
          ? 'Add your OpenAI API key in Settings > API Keys to enable AI insights.'
          : message || 'Unable to generate AI insights. Please try again later.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Render avatar stack for related contacts
  const renderAvatarStack = (
    contacts: Array<{ id: string; name: string; avatar?: string }>,
    maxVisible: number = 3
  ) => {
    const visibleContacts = contacts.slice(0, maxVisible);
    const remainingCount = Math.max(0, contacts.length - maxVisible);

    return (
      <div className="flex items-center mt-2">
        <div className="flex -space-x-2">
          {visibleContacts.map((contact, index) => (
            <div key={contact.id} className="relative" style={{ zIndex: maxVisible - index }}>
              <Avatar
                src={contact.avatar}
                alt={contact.name}
                size="sm"
                fallback={getInitials(contact.name)}
                className="border-2 border-white dark:border-gray-900"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-900 ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  const generateRealInsights = async () => {
    if (dealsArray.length === 0) {
      throw new Error('Add at least one deal to generate AI insights.');
    }
    const active = dealsArray.filter((d) => !isClosed(d.stage?.id));
    const summary = {
      totalDeals: dealsArray.length,
      activeDeals: active.length,
      activePipelineValue: active.reduce((sum, d) => sum + Number(d.value || 0), 0),
      wonDeals: dealsArray.filter((d) => d.stage?.id === 'closed-won').length,
      lostDeals: dealsArray.filter((d) => d.stage?.id === 'closed-lost').length,
      deals: dealsArray.slice(0, 25).map((d) => ({
        title: d.title,
        value: d.value,
        stage: d.stage?.id,
        probability: d.probability,
        daysInStage: d.daysInStage,
        priority: d.priority,
      })),
    };

    const response = await openAIService.generateContent({
      messages: [
        {
          role: 'system',
          content:
            'You are a sales pipeline analyst. Use only the data provided. Respond with JSON only, no markdown.',
        },
        {
          role: 'user',
          content: `Analyze this pipeline and return JSON: {"insights":[{"type":"success"|"warning"|"insight","title":string,"description":string}]} with 3 to 5 concise insights.\n${JSON.stringify(summary)}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 700,
      featureUsed: 'pipeline-insights',
    });

    const parsed = extractJson(response.content);
    const list = Array.isArray(parsed?.insights) ? parsed.insights : [];
    const valid = list
      .filter((i: any) => i && typeof i.title === 'string' && typeof i.description === 'string')
      .map((i: any) => ({
        type: (['success', 'warning', 'insight'].includes(i.type) ? i.type : 'insight') as InsightType,
        title: i.title,
        description: i.description,
      }));
    if (valid.length === 0) throw new Error('AI returned no usable insights.');
    setAiInsights(valid);
  };

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-8`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Pipeline Intelligence
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Pipeline counts from your deals, plus on-demand AI insights
            </p>
          </div>
        </div>
        <button
          onClick={generateInsights}
          disabled={isGenerating}
          className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isGenerating ? 'Analyzing...' : 'Generate Insights'}
          </span>
        </button>
      </div>

      {error && (
        <div className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <div className="flex items-start">
            <Info className={`h-5 w-5 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                AI insights unavailable
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`${
              isDark ? 'bg-white/5' : 'bg-white'
            } rounded-xl p-4 hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition-all group cursor-pointer`}
            onClick={() => openTool(TOOL_FOR_TYPE[insight.type])}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                <insight.icon size={16} className={insight.color} />
              </div>
              <div className="flex-1">
                <h3
                  className={`font-medium ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}
                >
                  {insight.title}
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {insight.description}
                </p>

                {/* Avatar stack for related contacts */}
                {insight.relatedContacts &&
                  insight.relatedContacts.length > 0 &&
                  renderAvatarStack(insight.relatedContacts)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {aiInsights.length > 0 && (
        <div className="mt-6" data-testid="ai-generated-insights">
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => {
              const st = styleFor(insight.type);
              return (
                <div
                  key={index}
                  className={`${isDark ? 'bg-white/5' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${st.bgColor}`}>
                      <st.icon size={16} className={st.color} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {insight.title}
                      </h4>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
