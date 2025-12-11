import React, { useEffect, useRef, useState } from 'react';
import { useDealStore } from '../../store/dealStore';
import { remoteAssistantBridge } from '../../services/remoteAssistantBridge';
import { Bot, MessageSquare, Brain, TrendingUp, Target, DollarSign } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId?: string;
  companyName?: string;
  probability?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RemoteDealsWithAssistantProps {
  onDealSelect?: (deal: Deal) => void;
  onDealUpdate?: (deal: Deal) => void;
}

const RemoteDealsWithAssistant: React.FC<RemoteDealsWithAssistantProps> = ({
  onDealSelect,
  onDealUpdate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { deals } = useDealStore();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [assistantActive, setAssistantActive] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [assistantInsights, setAssistantInsights] = useState<any>(null);

  useEffect(() => {
    if (iframeRef.current) {
      // Register with assistant bridge
      remoteAssistantBridge.registerIframe(iframeRef.current);

      // Setup message listener for remote deal app
      window.addEventListener('message', handleRemoteMessage);

      // Initialize with deal data
      const dealsData = Object.values(deals).map(deal => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        contactId: deal.contactId,
        companyName: deal.companyName,
        probability: deal.probability,
        notes: deal.notes,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt
      }));

      // Send initialization message to remote app
      const initMessage = {
        type: 'CRM_INIT',
        data: {
          deals: dealsData,
          crmInfo: {
            appName: 'SmartCRM',
            version: '1.0.0',
            features: ['ai-assistant', 'deal-intelligence', 'probability-scoring']
          },
          assistantCapabilities: {
            canAnalyzeDeals: true,
            canPredictOutcomes: true,
            canSuggestActions: true,
            canOptimizeValue: true
          }
        },
        timestamp: Date.now()
      };

      if (iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(initMessage, '*');
      }
    }

    return () => {
      if (iframeRef.current) {
        remoteAssistantBridge.unregisterIframe(iframeRef.current);
      }
      window.removeEventListener('message', handleRemoteMessage);
    };
  }, []);

  const handleRemoteMessage = async (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case 'REMOTE_DEAL_SELECTED':
        setSelectedDealId(data.dealId);
        setAssistantActive(true);
        if (onDealSelect) {
          onDealSelect(data.deal);
        }
        await initializeDealAssistant(data.dealId);
        break;

      case 'ASSISTANT_REQUEST':
        await handleAssistantRequest(data);
        break;

      case 'DEAL_ASSISTANT_CHAT':
        await handleDealChat(data);
        break;

      case 'REQUEST_DEAL_ANALYSIS':
        await handleDealAnalysis(data);
        break;

      case 'REQUEST_DEAL_SUGGESTIONS':
        await handleDealSuggestions(data);
        break;

      default:
        break;
    }
  };

  const initializeDealAssistant = async (dealId: string) => {
    const deal = deals[dealId];
    if (!deal) return;

    try {
      setIsAssistantLoading(true);
      
      // Initialize assistant for this deal
      const initMessage = {
        type: 'ASSISTANT_START_CONVERSATION',
        assistantType: 'deal',
        entityId: dealId,
        data: {
          initialMessage: `Initialize assistant for deal: ${deal.title}`,
          dealContext: {
            title: deal.title,
            value: deal.value,
            stage: deal.stage,
            probability: deal.probability,
            notes: deal.notes
          }
        }
      };

      window.postMessage(initMessage, '*');
      
      // Send assistant ready message to remote app
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'ASSISTANT_READY',
          data: {
            dealId,
            assistantType: 'deal',
            capabilities: {
              canChat: true,
              canAnalyze: true,
              canPredict: true,
              canOptimize: true
            }
          }
        }, '*');
      }
      
    } catch (error) {
      console.error('Failed to initialize deal assistant:', error);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleAssistantRequest = async (data: any) => {
    const { dealId, action, requestData } = data;
    setIsAssistantLoading(true);

    try {
      let response;
      
      switch (action) {
        case 'analyze_deal':
          response = await analyzeDeal(dealId, requestData);
          break;
        case 'predict_outcome':
          response = await predictDealOutcome(dealId, requestData);
          break;
        case 'suggest_actions':
          response = await suggestDealActions(dealId, requestData);
          break;
        case 'optimize_value':
          response = await optimizeDealValue(dealId, requestData);
          break;
        default:
          response = { error: 'Unknown action' };
      }

      // Send response back to remote app
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'ASSISTANT_RESPONSE',
          data: {
            dealId,
            action,
            response
          }
        }, '*');
      }
      
    } catch (error) {
      console.error('Assistant request failed:', error);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleDealChat = async (data: any) => {
    const { dealId, message } = data;
    
    const chatMessage = {
      type: 'ASSISTANT_SEND_MESSAGE',
      assistantType: 'deal',
      entityId: dealId,
      data: { message }
    };

    window.postMessage(chatMessage, '*');
  };

  const handleDealAnalysis = async (data: any) => {
    const { dealId } = data;
    const deal = deals[dealId];
    
    if (!deal) return;

    const analysis = {
      dealHealth: calculateDealHealth(deal),
      riskFactors: identifyRiskFactors(deal),
      opportunities: identifyOpportunities(deal),
      nextActions: suggestNextActions(deal),
      valueOptimization: suggestValueOptimization(deal)
    };

    setAssistantInsights(analysis);

    // Send analysis to remote app
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'DEAL_ANALYSIS_RESPONSE',
        data: {
          dealId,
          analysis
        }
      }, '*');
    }
  };

  const handleDealSuggestions = async (data: any) => {
    const { dealId, context } = data;
    const deal = deals[dealId];
    
    if (!deal) return;

    const suggestions = generateDealSuggestions(deal, context);

    // Send suggestions to remote app
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'DEAL_SUGGESTIONS_RESPONSE',
        data: {
          dealId,
          suggestions
        }
      }, '*');
    }
  };

  // AI Analysis Functions
  const analyzeDeal = async (dealId: string, context: any) => {
    const deal = deals[dealId];
    return {
      probability: Math.round((deal.probability || 50) + Math.random() * 20),
      health: calculateDealHealth(deal),
      insights: [
        'Strong engagement from decision maker',
        'Budget confirmed and approved',
        'Timeline aligns with quarterly goals'
      ]
    };
  };

  const predictDealOutcome = async (dealId: string, context: any) => {
    const deal = deals[dealId];
    return {
      winProbability: Math.round((deal.probability || 50) + Math.random() * 30),
      estimatedCloseDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      riskLevel: deal.value > 50000 ? 'Medium' : 'Low',
      confidenceScore: Math.round(Math.random() * 40 + 60)
    };
  };

  const suggestDealActions = async (dealId: string, context: any) => {
    const deal = deals[dealId];
    return {
      immediate: [
        'Schedule decision-maker meeting',
        'Send ROI proposal',
        'Confirm budget timeline'
      ],
      shortTerm: [
        'Introduce implementation team',
        'Provide case studies',
        'Set up pilot program'
      ],
      priority: 'high'
    };
  };

  const optimizeDealValue = async (dealId: string, context: any) => {
    const deal = deals[dealId];
    return {
      currentValue: deal.value,
      optimizedValue: Math.round(deal.value * (1 + Math.random() * 0.3)),
      recommendations: [
        'Add premium support package',
        'Include training services',
        'Offer multi-year discount'
      ],
      upliftPotential: '15-30%'
    };
  };

  // Helper Functions
  const calculateDealHealth = (deal: any) => {
    let score = 70; // Base score
    if (deal.probability > 70) score += 20;
    if (deal.value > 100000) score += 10;
    if (deal.notes && deal.notes.length > 50) score += 10;
    return Math.min(score, 100);
  };

  const identifyRiskFactors = (deal: any) => {
    const risks = [];
    if (deal.probability < 30) risks.push('Low win probability');
    if (!deal.notes || deal.notes.length < 20) risks.push('Insufficient deal notes');
    if (deal.value > 200000) risks.push('High-value deal requires executive approval');
    return risks;
  };

  const identifyOpportunities = (deal: any) => {
    return [
      'Upsell additional services',
      'Extend contract term',
      'Add implementation support'
    ];
  };

  const suggestNextActions = (deal: any) => {
    return [
      'Schedule follow-up call',
      'Send proposal details',
      'Confirm decision timeline'
    ];
  };

  const suggestValueOptimization = (deal: any) => {
    return [
      'Bundle services for discount',
      'Offer payment plan options',
      'Include training and support'
    ];
  };

  const generateDealSuggestions = (deal: any, context: any) => {
    return {
      communication: [
        'Send personalized follow-up email',
        'Schedule stakeholder presentation',
        'Provide relevant case studies'
      ],
      strategy: [
        'Focus on ROI demonstration',
        'Address budget concerns',
        'Expedite decision timeline'
      ],
      nextSteps: [
        'Prepare contract terms',
        'Set up implementation plan',
        'Schedule kickoff meeting'
      ]
    };
  };

  return (
    <div className="w-full h-full relative">
      <iframe
        ref={iframeRef}
        src="https://your-remote-deals-app-url.com"
        className="w-full h-full border-0"
        title="Remote Deals with AI Assistant"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {/* AI Assistant Indicator */}
      {assistantActive && selectedDealId && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${isAssistantLoading ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isAssistantLoading ? (
                  <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                ) : (
                  <Bot className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">Deal Assistant</div>
                <div className="text-sm text-gray-500">
                  {isAssistantLoading ? 'Analyzing...' : 'Ready'}
                </div>
              </div>
            </div>
            
            {assistantInsights && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Deal Health</span>
                  <span className="text-xs font-medium">{assistantInsights.dealHealth}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">AI Analysis Active</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assistant Quick Actions */}
      {assistantActive && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Quick Actions</span>
            </div>
            <div className="space-y-1">
              <button className="w-full text-left text-xs text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100">
                Analyze Deal
              </button>
              <button className="w-full text-left text-xs text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100">
                Predict Outcome
              </button>
              <button className="w-full text-left text-xs text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100">
                Suggest Actions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteDealsWithAssistant;