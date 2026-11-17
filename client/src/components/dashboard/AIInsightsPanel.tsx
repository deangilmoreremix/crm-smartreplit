import React, { useState } from 'react';
import { Brain, Zap, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAITools } from '../../components/AIToolsProvider';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { useAIApiKeys } from '../../hooks/useAIApiKeys';
import { generateAI } from '../../services/aiGenerate';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

interface Insight {
  type: 'success' | 'warning' | 'insight';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  relatedContacts?: Array<{ id: string; name: string; avatar?: string }>;
}

const INSIGHTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['insights'],
  properties: {
    insights: {
      type: 'array',
      description: 'Exactly three insights about the pipeline, one per type',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'description'],
        properties: {
          type: { type: 'string', enum: ['success', 'warning', 'insight'] },
          title: { type: 'string' },
          description: { type: 'string', description: 'One or two sentences that cite numbers from the provided data' },
        },
      },
    },
  },
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const isOpen = (stage: unknown) => stage !== 'closed-won' && stage !== 'closed-lost';

const AIInsightsPanel = () => {
  const { isDark } = useTheme();
  const { openTool } = useAITools();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  const { apiConfig, isLoading: keysLoading } = useAIApiKeys();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<Insight[] | null>(null);

  const apiKeysConfigured = keysLoading || !!apiConfig.openai.apiKey;

  const styleFor = (type: Insight['type']) =>
    type === 'success'
      ? { icon: CheckCircle, color: isDark ? 'text-green-400' : 'text-green-600', bgColor: isDark ? 'bg-green-500/20' : 'bg-green-100' }
      : type === 'warning'
        ? { icon: AlertTriangle, color: isDark ? 'text-orange-400' : 'text-orange-600', bgColor: isDark ? 'bg-orange-500/20' : 'bg-orange-100' }
        : { icon: TrendingUp, color: isDark ? 'text-blue-400' : 'text-blue-600', bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100' };

  const contactsFor = (list: Array<{ contactId: string }>) =>
    list
      .map((deal) => {
        const contact = contacts[deal.contactId];
        return contact ? { id: contact.id, name: contact.name, avatar: contact.avatar } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; avatar?: string }>;

  // Counts computed from the deals in the store; nothing here is an AI result or a trend claim
  const createComputedInsights = (): Insight[] => {
    const activeDeals = Object.values(deals).filter((deal) => isOpen(deal.stage));
    const pipelineValue = activeDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
    const highValueDeals = activeDeals.filter((deal) => deal.value > 50000);
    const daysStalled = (deal: (typeof activeDeals)[number]) =>
      deal.daysInStage ?? (deal.updatedAt ? Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / DAY_MS) : 0);
    const stalledDeals = activeDeals.filter((deal) => daysStalled(deal) > 10);
    const highProbDeals = activeDeals.filter((deal) => deal.probability > 70);

    return [
      {
        type: 'success',
        title: 'Open Pipeline',
        description: `${activeDeals.length} open deals worth $${pipelineValue.toLocaleString()}; ${highValueDeals.length} over $50,000.`,
        ...styleFor('success'),
        relatedContacts: contactsFor(highValueDeals),
      },
      {
        type: 'warning',
        title: 'Stalled Deals',
        description: `${stalledDeals.length} open deals have been in their stage for more than 10 days.`,
        ...styleFor('warning'),
        relatedContacts: contactsFor(stalledDeals),
      },
      {
        type: 'insight',
        title: 'High-Probability Deals',
        description: `${highProbDeals.length} open deals are above 70% probability.`,
        ...styleFor('insight'),
        relatedContacts: contactsFor(highProbDeals),
      },
    ];
  };

  const insights = aiInsights ?? createComputedInsights();

  const generateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await generateRealInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
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
    const dealsArray = Object.values(deals);
    const contactsArray = Object.values(contacts);
    if (dealsArray.length === 0) {
      throw new Error('Add deals to your pipeline before generating insights.');
    }

    const openDeals = dealsArray.filter((d) => isOpen(d.stage));
    const pipelineData = {
      deals: dealsArray.map((deal) => ({
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        daysInStage: deal.daysInStage,
        priority: deal.priority,
      })),
      summary: {
        openDealCount: openDeals.length,
        openPipelineValue: openDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0),
        contactCount: contactsArray.length,
        hotLeadsCount: contactsArray.filter((c) => c.status === 'hot').length,
      },
    };

    const result = await generateAI({
      system:
        'You are a sales pipeline analyst. Use only the data provided and cite its numbers. Do not state trends, percentages or comparisons to earlier periods that are not in the data.',
      prompt: `Give exactly three insights (one success, one warning, one insight) about this pipeline: ${JSON.stringify(pipelineData)}`,
      schema: INSIGHTS_SCHEMA as unknown as Record<string, unknown>,
      schemaName: 'pipeline_insights',
    });
    const items = result.data?.insights;
    if (!Array.isArray(items) || items.length === 0) throw new Error('The AI response had no insights');

    setAiInsights(
      items.map((item: any) => {
        const type: Insight['type'] = ['success', 'warning', 'insight'].includes(item.type) ? item.type : 'insight';
        return { type, title: String(item.title || ''), description: String(item.description || ''), ...styleFor(type) };
      })
    );
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
              {aiInsights
                ? 'AI insights generated from your pipeline'
                : apiKeysConfigured
                  ? 'Pipeline counts from your deals. Generate AI insights on demand.'
                  : 'Add your OpenAI API key in Settings to enable AI insights'}
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
        <div role="alert" className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <div className="flex items-start">
            <Info className={`h-5 w-5 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                AI Service Unavailable
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </p>
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
            onClick={() => {
              // Open the corresponding AI tool based on insight type
              const toolMap: Record<string, string> = {
                success: 'pipeline-analysis',
                warning: 'deal-alerts',
                insight: 'smart-insights',
              };

              const toolName = toolMap[insight.type] || 'ai-insights';
              openTool(toolName);
            }}
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
    </div>
  );
};

export default AIInsightsPanel;
