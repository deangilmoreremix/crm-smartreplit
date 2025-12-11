import React, { useState, useEffect } from 'react';
import { Brain, Zap, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAITools } from '../../components/AIToolsProvider';
import { useDealStore } from '../../store/dealStore';
import { useContactStore } from '../../store/contactStore';
import { geminiService } from '../../services/geminiService';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

interface Insight {
  type: 'success' | 'warning' | 'insight';
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  relatedContacts?: Array<{ id: string; name: string; avatar?: string; }>;
}

const AIInsightsPanel = () => {
  const { isDark } = useTheme();
  const { openTool } = useAITools();
  const { deals } = useDealStore();
  const { contacts } = useContactStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(true);

  // Create initial insights with the three required categories
  const createDefaultInsights = (): Insight[] => {
    // Get contacts for the insights
    const activeDeals = Object.values(deals).filter(deal => 
      deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    );

    // High value deals
    const highValueDeals = activeDeals.filter(deal => deal.value > 50000);
    const highValueContacts = highValueDeals.map(deal => {
      const contact = contacts[deal.contactId];
      return contact ? {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;

    // Stalled deals
    const stalledDeals = activeDeals.filter(deal => deal.daysInStage && deal.daysInStage > 10);
    const stalledContacts = stalledDeals.map(deal => {
      const contact = contacts[deal.contactId];
      return contact ? {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;

    // High probability deals
    const highProbDeals = activeDeals.filter(deal => deal.probability > 70);
    const highProbContacts = highProbDeals.map(deal => {
      const contact = contacts[deal.contactId];
      return contact ? {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; avatar?: string; }>;

    return [
      {
        type: 'success',
        title: 'Pipeline Health Strong',
        description: 'Your pipeline velocity has increased 23% this month with high-quality leads entering the qualification stage.',
        icon: CheckCircle,
        color: isDark ? 'text-green-400' : 'text-green-600',
        bgColor: isDark ? 'bg-green-500/20' : 'bg-green-100',
        relatedContacts: highValueContacts
      },
      {
        type: 'warning',
        title: 'Deal Risk Alert',
        description: `${stalledDeals.length} high-value deals show stagnation in negotiation stage. Consider immediate follow-up actions.`,
        icon: AlertTriangle,
        color: isDark ? 'text-orange-400' : 'text-orange-600',
        bgColor: isDark ? 'bg-orange-500/20' : 'bg-orange-100',
        relatedContacts: stalledContacts
      },
      {
        type: 'insight',
        title: 'Conversion Opportunity',
        description: `AI identified ${highProbDeals.length} prospects with 85%+ closing probability. Prioritize these for immediate attention.`,
        icon: TrendingUp,
        color: isDark ? 'text-blue-400' : 'text-blue-600',
        bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
        relatedContacts: highProbContacts
      }
    ];
  };
  
  const [insights, setInsights] = useState<Insight[]>(createDefaultInsights());

  // DISABLED: Using demo data only, no API calls
  // useEffect(() => {
  //   // Generate initial insights when component mounts
  //   generateInitialInsights();
  // }, []);

  // When theme changes, regenerate default insights to update colors
  useEffect(() => {
    setInsights(createDefaultInsights());
  }, [isDark]);

  const generateInitialInsights = async () => {
    // Only generate if we have enough data
    if (Object.keys(deals).length < 2 || Object.keys(contacts).length < 2) {
      return;
    }
    
    if (!geminiService.isApiKeyConfigured()) {
      setApiKeysConfigured(false);
      return;
    }

    try {
      await generateRealInsights();
    } catch (error) {
      console.error("Failed to generate initial insights:", error);
      setApiKeysConfigured(false);
      // Don't set error state for initial load failures
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      await generateRealInsights();
    } catch (error) {
      console.error("Failed to generate insights:", error);
      // Set a more user-friendly error message
      setError("Unable to generate AI insights at this time. Please try again later.");
      setApiKeysConfigured(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Render avatar stack for related contacts
  const renderAvatarStack = (contacts: Array<{ id: string; name: string; avatar?: string }>, maxVisible: number = 3) => {
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
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-gray-900 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    );
  };

  const generateRealInsights = async () => {
    if (!geminiService.isApiKeyConfigured()) {
      setError("Gemini API key is not configured. Please add VITE_GOOGLE_AI_API_KEY to your environment.");
      setApiKeysConfigured(false);
      return;
    }
    
    // Convert to arrays for analysis
    const dealsArray = Object.values(deals);
    const contactsArray = Object.values(contacts);
    
    // Prepare pipeline data for analysis
    const pipelineData = {
      deals: dealsArray.map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        daysInStage: deal.daysInStage,
        priority: deal.priority,
        contactId: deal.contactId
      })),
      contacts: contactsArray.map(contact => ({
        id: contact.id,
        name: contact.name,
        company: contact.company,
        status: contact.status,
        source: contact.source,
        tags: contact.tags
      })),
      summary: {
        activeDealCount: dealsArray.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length,
        totalPipelineValue: dealsArray.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
          .reduce((sum, deal) => sum + deal.value, 0),
        avgDealSize: dealsArray.length > 0 ? 
          dealsArray.reduce((sum, deal) => sum + deal.value, 0) / dealsArray.length : 0,
        hotLeadsCount: contactsArray.filter(c => c.status === 'hot').length
      }
    };
    
    try {
      // Use geminiService to analyze pipeline health
      const response = await geminiService.generatePersonalizedMessage(pipelineData, 'email');
      
      // Reset API keys configured flag if we got a successful result
      setApiKeysConfigured(true);

      // Get default insights
      const defaultInsights = createDefaultInsights();
      
      // For now, keep the default insights since the service doesn't have pipeline analysis
      if (response) {
        setInsights(defaultInsights);
      }
      
    } catch (error) {
      console.error("Error generating insights:", error);
      // Set a more user-friendly error message
      setError("Unable to generate AI insights at this time. Please try again later.");
      setApiKeysConfigured(false);
    }
  };

  return (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-8`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Pipeline Intelligence</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {apiKeysConfigured ? 'Real-time insights powered by AI' : 'Configure API keys to enable AI features'}
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
        <div className={`p-4 mb-4 rounded-lg ${
          isDark ? 'bg-red-500/10' : 'bg-red-50'
        }`}>
          <div className="flex items-start">
            <Info className={`h-5 w-5 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                AI Service Unavailable
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {error.includes("API key") ? 
                  "Please configure your AI API keys in the .env file to enable AI insights." :
                  error
                }
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
                'success': 'pipeline-analysis',
                'warning': 'deal-alerts',
                'insight': 'smart-insights'
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
                <h3 className={`font-medium ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}>
                  {insight.title}
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{insight.description}</p>
                
                {/* Avatar stack for related contacts */}
                {insight.relatedContacts && insight.relatedContacts.length > 0 && (
                  renderAvatarStack(insight.relatedContacts)
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightsPanel;