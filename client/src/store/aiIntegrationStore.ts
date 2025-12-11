import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  AIAutomationRule, 
  AIInsight, 
  AIWorkflow, 
  AIModel, 
  SmartSuggestion, 
  DataEnrichmentRequest,
  AIIntegrationSettings,
  WorkflowExecution,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction
} from '../types/aiIntegration';

interface AIIntegrationState {
  // Automation Rules
  automationRules: AIAutomationRule[];
  activeRules: number;
  
  // AI Insights
  insights: AIInsight[];
  newInsights: number;
  
  // Workflows
  workflows: AIWorkflow[];
  workflowExecutions: WorkflowExecution[];
  
  // AI Models
  models: AIModel[];
  activeModel: string;
  
  // Smart Suggestions
  suggestions: SmartSuggestion[];
  pendingSuggestions: number;
  
  // Data Enrichment
  enrichmentRequests: DataEnrichmentRequest[];
  enrichmentCredits: number;
  
  // Settings
  settings: AIIntegrationSettings[];
  
  // Loading States
  loading: {
    rules: boolean;
    insights: boolean;
    workflows: boolean;
    suggestions: boolean;
    enrichment: boolean;
  };
  
  // Actions
  // Automation Rules
  createAutomationRule: (rule: Omit<AIAutomationRule, 'id' | 'createdAt' | 'executionCount' | 'successRate'>) => void;
  updateAutomationRule: (id: string, updates: Partial<AIAutomationRule>) => void;
  deleteAutomationRule: (id: string) => void;
  toggleAutomationRule: (id: string) => void;
  executeAutomationRule: (id: string, context?: Record<string, any>) => Promise<boolean>;
  
  // AI Insights
  generateInsights: () => Promise<void>;
  dismissInsight: (id: string) => void;
  actOnInsight: (id: string, action: string) => void;
  markInsightReviewed: (id: string) => void;
  
  // Workflows
  createWorkflow: (workflow: Omit<AIWorkflow, 'id' | 'createdAt' | 'executionHistory' | 'analytics'>) => void;
  updateWorkflow: (id: string, updates: Partial<AIWorkflow>) => void;
  deleteWorkflow: (id: string) => void;
  executeWorkflow: (id: string, context?: Record<string, any>) => Promise<string>;
  pauseWorkflow: (executionId: string) => void;
  resumeWorkflow: (executionId: string) => void;
  cancelWorkflow: (executionId: string) => void;
  
  // Smart Suggestions
  generateSuggestions: (context: { entityType: string; entityId: string }) => Promise<void>;
  acceptSuggestion: (id: string) => Promise<void>;
  dismissSuggestion: (id: string) => void;
  provideFeedback: (id: string, feedback: { helpful: boolean; comment?: string }) => void;
  
  // Data Enrichment
  requestEnrichment: (request: Omit<DataEnrichmentRequest, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  getEnrichmentStatus: (id: string) => Promise<DataEnrichmentRequest>;
  purchaseEnrichmentCredits: (amount: number) => Promise<void>;
  
  // AI Models
  addModel: (model: Omit<AIModel, 'id' | 'usage' | 'createdAt'>) => void;
  updateModel: (id: string, updates: Partial<AIModel>) => void;
  setActiveModel: (id: string) => void;
  testModel: (id: string, prompt: string) => Promise<string>;
  
  // Settings
  updateSetting: (id: string, value: any) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
  
  // Analytics
  getAutomationAnalytics: () => {
    totalRules: number;
    activeRules: number;
    executionsToday: number;
    successRate: number;
    topPerformingRules: AIAutomationRule[];
  };
  
  getWorkflowAnalytics: () => {
    totalWorkflows: number;
    activeWorkflows: number;
    executionsThisWeek: number;
    averageDuration: number;
    mostUsedWorkflows: AIWorkflow[];
  };
}

export const useAIIntegrationStore = create<AIIntegrationState>()(
  devtools(
    (set, get) => ({
      // Initial State
      automationRules: [],
      activeRules: 0,
      insights: [],
      newInsights: 0,
      workflows: [],
      workflowExecutions: [],
      models: [],
      activeModel: 'gpt-4',
      suggestions: [],
      pendingSuggestions: 0,
      enrichmentRequests: [],
      enrichmentCredits: 1000,
      settings: [],
      loading: {
        rules: false,
        insights: false,
        workflows: false,
        suggestions: false,
        enrichment: false,
      },

      // Automation Rules Actions
      createAutomationRule: (rule) => {
        const newRule: AIAutomationRule = {
          ...rule,
          id: `rule_${Date.now()}`,
          createdAt: new Date(),
          executionCount: 0,
          successRate: 0,
        };

        set((state) => ({
          automationRules: [...state.automationRules, newRule],
          activeRules: newRule.isActive ? state.activeRules + 1 : state.activeRules,
        }));
      },

      updateAutomationRule: (id, updates) => {
        set((state) => ({
          automationRules: state.automationRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        }));
      },

      deleteAutomationRule: (id) => {
        set((state) => ({
          automationRules: state.automationRules.filter((rule) => rule.id !== id),
          activeRules: state.automationRules.find(r => r.id === id)?.isActive 
            ? state.activeRules - 1 
            : state.activeRules,
        }));
      },

      toggleAutomationRule: (id) => {
        set((state) => ({
          automationRules: state.automationRules.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          ),
          activeRules: state.automationRules.find(r => r.id === id)?.isActive
            ? state.activeRules - 1
            : state.activeRules + 1,
        }));
      },

      executeAutomationRule: async (id, context = {}) => {
        const rule = get().automationRules.find(r => r.id === id);
        if (!rule) return false;

        try {
          // Simulate rule execution
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => ({
            automationRules: state.automationRules.map((r) =>
              r.id === id 
                ? { 
                    ...r, 
                    lastExecuted: new Date(),
                    executionCount: r.executionCount + 1,
                    successRate: (r.successRate * r.executionCount + 1) / (r.executionCount + 1)
                  } 
                : r
            ),
          }));

          return true;
        } catch (error) {
          console.error('Rule execution failed:', error);
          return false;
        }
      },

      // AI Insights Actions
      generateInsights: async () => {
        set((state) => ({
          loading: { ...state.loading, insights: true },
        }));

        try {
          // Simulate AI insight generation
          await new Promise(resolve => setTimeout(resolve, 2000));

          const mockInsights: AIInsight[] = [
            {
              id: `insight_${Date.now()}_1`,
              type: 'opportunity',
              title: 'High-Value Lead Identified',
              description: 'Contact John Smith shows strong buying signals based on recent interactions.',
              confidence: 0.85,
              impact: 'high',
              category: 'sales',
              data: {
                metrics: { engagement_score: 92, deal_probability: 0.78 },
                trends: [],
                predictions: [],
                recommendations: [
                  'Schedule a demo call within 48 hours',
                  'Send personalized proposal with enterprise features',
                  'Involve technical team for solution architecture discussion'
                ]
              },
              actionable: true,
              deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
              relatedEntities: [
                { type: 'contact', id: 'contact_1', name: 'John Smith' }
              ],
              tags: ['high-priority', 'enterprise', 'demo-ready'],
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'new'
            },
            {
              id: `insight_${Date.now()}_2`,
              type: 'risk',
              title: 'Deal at Risk of Churning',
              description: 'TechCorp deal shows declining engagement and delayed responses.',
              confidence: 0.72,
              impact: 'critical',
              category: 'sales',
              data: {
                metrics: { engagement_score: 34, response_time: 120 },
                trends: [],
                predictions: [],
                recommendations: [
                  'Immediate executive outreach required',
                  'Schedule relationship review meeting',
                  'Provide additional value demonstration'
                ]
              },
              actionable: true,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
              relatedEntities: [
                { type: 'deal', id: 'deal_1', name: 'TechCorp Enterprise License' }
              ],
              tags: ['at-risk', 'urgent', 'executive-attention'],
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'new'
            },
            {
              id: `insight_${Date.now()}_3`,
              type: 'prediction',
              title: 'Q4 Revenue Forecast Update',
              description: 'Based on current pipeline, Q4 revenue likely to exceed target by 15%.',
              confidence: 0.91,
              impact: 'medium',
              category: 'finance',
              data: {
                metrics: { current_pipeline: 2400000, forecasted_close: 0.65 },
                trends: [],
                predictions: [
                  {
                    metric: 'Q4 Revenue',
                    currentValue: 1800000,
                    predictedValue: 2070000,
                    confidence: 0.91,
                    timeframe: 'End of Q4',
                    factors: ['Strong pipeline', 'High close rates', 'Large deal momentum']
                  }
                ],
                recommendations: [
                  'Prepare for higher capacity needs',
                  'Consider accelerating Q1 planning',
                  'Review compensation plans for over-achievement'
                ]
              },
              actionable: true,
              relatedEntities: [],
              tags: ['forecast', 'positive', 'planning'],
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'new'
            }
          ];

          set((state) => ({
            insights: [...mockInsights, ...state.insights],
            newInsights: state.newInsights + mockInsights.length,
            loading: { ...state.loading, insights: false },
          }));
        } catch (error) {
          console.error('Failed to generate insights:', error);
          set((state) => ({
            loading: { ...state.loading, insights: false },
          }));
        }
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, status: 'dismissed' } : insight
          ),
          newInsights: state.insights.find(i => i.id === id)?.status === 'new' 
            ? state.newInsights - 1 
            : state.newInsights,
        }));
      },

      actOnInsight: (id, action) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, status: 'acted_upon' } : insight
          ),
          newInsights: state.insights.find(i => i.id === id)?.status === 'new'
            ? state.newInsights - 1
            : state.newInsights,
        }));
      },

      markInsightReviewed: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, status: 'reviewing' } : insight
          ),
          newInsights: state.insights.find(i => i.id === id)?.status === 'new'
            ? state.newInsights - 1
            : state.newInsights,
        }));
      },

      // Workflow Actions
      createWorkflow: (workflow) => {
        const newWorkflow: AIWorkflow = {
          ...workflow,
          id: `workflow_${Date.now()}`,
          createdAt: new Date(),
          lastModified: new Date(),
          executionHistory: [],
          analytics: {
            totalExecutions: 0,
            successRate: 0,
            averageDuration: 0,
            errorRate: 0,
            performance: {
              daily: [],
              weekly: [],
              monthly: []
            }
          }
        };

        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
        }));
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id 
              ? { ...workflow, ...updates, lastModified: new Date() } 
              : workflow
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== id),
        }));
      },

      executeWorkflow: async (id, context = {}) => {
        const workflow = get().workflows.find(w => w.id === id);
        if (!workflow) throw new Error('Workflow not found');

        const executionId = `exec_${Date.now()}`;
        const execution: WorkflowExecution = {
          id: executionId,
          workflowId: id,
          status: 'running',
          startTime: new Date(),
          stepResults: [],
          triggeredBy: 'manual',
          context,
        };

        set((state) => ({
          workflowExecutions: [...state.workflowExecutions, execution],
        }));

        try {
          // Simulate workflow execution
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          set((state) => ({
            workflowExecutions: state.workflowExecutions.map((exec) =>
              exec.id === executionId
                ? { ...exec, status: 'completed', endTime: new Date(), duration: 3000 }
                : exec
            ),
          }));

          return executionId;
        } catch (error) {
          set((state) => ({
            workflowExecutions: state.workflowExecutions.map((exec) =>
              exec.id === executionId
                ? { ...exec, status: 'failed', endTime: new Date(), error: error.message }
                : exec
            ),
          }));
          throw error;
        }
      },

      pauseWorkflow: (executionId) => {
        set((state) => ({
          workflowExecutions: state.workflowExecutions.map((exec) =>
            exec.id === executionId ? { ...exec, status: 'paused' } : exec
          ),
        }));
      },

      resumeWorkflow: (executionId) => {
        set((state) => ({
          workflowExecutions: state.workflowExecutions.map((exec) =>
            exec.id === executionId ? { ...exec, status: 'running' } : exec
          ),
        }));
      },

      cancelWorkflow: (executionId) => {
        set((state) => ({
          workflowExecutions: state.workflowExecutions.map((exec) =>
            exec.id === executionId 
              ? { ...exec, status: 'cancelled', endTime: new Date() } 
              : exec
          ),
        }));
      },

      // Smart Suggestions Actions
      generateSuggestions: async (context) => {
        set((state) => ({
          loading: { ...state.loading, suggestions: true },
        }));

        try {
          // Simulate AI suggestion generation
          await new Promise(resolve => setTimeout(resolve, 1500));

          const mockSuggestions: SmartSuggestion[] = [
            {
              id: `suggestion_${Date.now()}_1`,
              type: 'email_reply',
              title: 'Suggested Email Response',
              description: 'AI-generated response to customer inquiry about pricing.',
              context,
              action: {
                type: 'send_email',
                config: {
                  subject: 'Re: Pricing Information Request',
                  body: 'Thank you for your interest in our solution...'
                },
                preview: 'Thank you for your interest in our solution. Based on your requirements...'
              },
              confidence: 0.87,
              reasoning: 'Based on similar successful interactions and customer profile analysis.',
              aiModel: 'gpt-4',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: 'pending'
            },
            {
              id: `suggestion_${Date.now()}_2`,
              type: 'task_creation',
              title: 'Follow-up Task Recommended',
              description: 'Create a follow-up task based on meeting outcomes.',
              context,
              action: {
                type: 'create_task',
                config: {
                  title: 'Send technical proposal to John Smith',
                  description: 'Based on demo feedback, prepare technical proposal...',
                  priority: 'high',
                  dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
                }
              },
              confidence: 0.92,
              reasoning: 'Meeting notes indicate technical requirements discussion and next steps agreement.',
              aiModel: 'gpt-4',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
              status: 'pending'
            }
          ];

          set((state) => ({
            suggestions: [...mockSuggestions, ...state.suggestions],
            pendingSuggestions: state.pendingSuggestions + mockSuggestions.length,
            loading: { ...state.loading, suggestions: false },
          }));
        } catch (error) {
          console.error('Failed to generate suggestions:', error);
          set((state) => ({
            loading: { ...state.loading, suggestions: false },
          }));
        }
      },

      acceptSuggestion: async (id) => {
        const suggestion = get().suggestions.find(s => s.id === id);
        if (!suggestion) return;

        try {
          // Simulate executing the suggestion
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => ({
            suggestions: state.suggestions.map((s) =>
              s.id === id ? { ...s, status: 'accepted' } : s
            ),
            pendingSuggestions: state.pendingSuggestions - 1,
          }));
        } catch (error) {
          console.error('Failed to accept suggestion:', error);
        }
      },

      dismissSuggestion: (id) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, status: 'dismissed' } : s
          ),
          pendingSuggestions: state.pendingSuggestions - 1,
        }));
      },

      provideFeedback: (id, feedback) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, feedback } : s
          ),
        }));
      },

      // Data Enrichment Actions
      requestEnrichment: async (request) => {
        const enrichmentRequest: DataEnrichmentRequest = {
          ...request,
          id: `enrich_${Date.now()}`,
          createdAt: new Date(),
          status: 'pending',
        };

        set((state) => ({
          enrichmentRequests: [...state.enrichmentRequests, enrichmentRequest],
          loading: { ...state.loading, enrichment: true },
        }));

        try {
          // Simulate enrichment processing
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set((state) => ({
            enrichmentRequests: state.enrichmentRequests.map((req) =>
              req.id === enrichmentRequest.id 
                ? { 
                    ...req, 
                    status: 'completed',
                    completedAt: new Date(),
                    results: [
                      {
                        field: 'company_size',
                        value: '500-1000',
                        confidence: 0.92,
                        source: 'clearbit',
                        lastUpdated: new Date(),
                        verified: false
                      }
                    ],
                    cost: 2
                  }
                : req
            ),
            enrichmentCredits: state.enrichmentCredits - 2,
            loading: { ...state.loading, enrichment: false },
          }));

          return enrichmentRequest.id;
        } catch (error) {
          set((state) => ({
            enrichmentRequests: state.enrichmentRequests.map((req) =>
              req.id === enrichmentRequest.id 
                ? { ...req, status: 'failed', error: error.message }
                : req
            ),
            loading: { ...state.loading, enrichment: false },
          }));
          throw error;
        }
      },

      getEnrichmentStatus: async (id) => {
        const request = get().enrichmentRequests.find(r => r.id === id);
        if (!request) throw new Error('Enrichment request not found');
        return request;
      },

      purchaseEnrichmentCredits: async (amount) => {
        // Simulate credit purchase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set((state) => ({
          enrichmentCredits: state.enrichmentCredits + amount,
        }));
      },

      // AI Models Actions
      addModel: (model) => {
        const newModel: AIModel = {
          ...model,
          id: `model_${Date.now()}`,
          usage: {
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            lastMonth: { requests: 0, tokens: 0, cost: 0 },
            currentMonth: { requests: 0, tokens: 0, cost: 0 },
            trend: 'stable'
          },
          createdAt: new Date(),
        };

        set((state) => ({
          models: [...state.models, newModel],
        }));
      },

      updateModel: (id, updates) => {
        set((state) => ({
          models: state.models.map((model) =>
            model.id === id ? { ...model, ...updates, lastUsed: new Date() } : model
          ),
        }));
      },

      setActiveModel: (id) => {
        set({ activeModel: id });
      },

      testModel: async (id, prompt) => {
        const model = get().models.find(m => m.id === id);
        if (!model) throw new Error('Model not found');

        // Simulate model testing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return `Test response from ${model.name}: This is a simulated response to: "${prompt}"`;
      },

      // Settings Actions
      updateSetting: (id, value) => {
        set((state) => ({
          settings: state.settings.map((setting) =>
            setting.id === id 
              ? { ...setting, value, lastModified: new Date() } 
              : setting
          ),
        }));
      },

      resetSettings: () => {
        // Reset to default settings
        set({ settings: [] });
      },

      exportSettings: () => {
        const settings = get().settings;
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const importedSettings = JSON.parse(settingsJson);
          set({ settings: importedSettings });
        } catch (error) {
          console.error('Failed to import settings:', error);
        }
      },

      // Analytics
      getAutomationAnalytics: () => {
        const { automationRules } = get();
        const activeRules = automationRules.filter(rule => rule.isActive).length;
        const totalExecutions = automationRules.reduce((sum, rule) => sum + rule.executionCount, 0);
        const successRate = automationRules.length > 0 
          ? automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length 
          : 0;

        return {
          totalRules: automationRules.length,
          activeRules,
          executionsToday: Math.floor(totalExecutions * 0.1), // Mock daily executions
          successRate,
          topPerformingRules: automationRules
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5)
        };
      },

      getWorkflowAnalytics: () => {
        const { workflows, workflowExecutions } = get();
        const activeWorkflows = workflows.filter(w => w.isActive).length;
        const completedExecutions = workflowExecutions.filter(e => e.status === 'completed');
        const averageDuration = completedExecutions.length > 0
          ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
          : 0;

        return {
          totalWorkflows: workflows.length,
          activeWorkflows,
          executionsThisWeek: workflowExecutions.filter(e => 
            e.startTime > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          averageDuration,
          mostUsedWorkflows: workflows
            .sort((a, b) => b.analytics.totalExecutions - a.analytics.totalExecutions)
            .slice(0, 5)
        };
      },
    }),
    {
      name: 'ai-integration-store',
    }
  )
);
