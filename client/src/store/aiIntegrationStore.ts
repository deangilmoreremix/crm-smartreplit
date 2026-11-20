import { create } from 'zustand';
import { generateAI } from '../services/aiGenerate';
import { useContactStore } from '../hooks/useContactStore';
import { useDealStore } from './dealStore';
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
  AutomationAction,
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
  createAutomationRule: (
    rule: Omit<AIAutomationRule, 'id' | 'createdAt' | 'executionCount' | 'successRate'>
  ) => void;
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
  createWorkflow: (
    workflow: Omit<AIWorkflow, 'id' | 'createdAt' | 'executionHistory' | 'analytics'>
  ) => void;
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
  requestEnrichment: (
    request: Omit<DataEnrichmentRequest, 'id' | 'createdAt' | 'status'>
  ) => Promise<string>;
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
      activeModel: 'gpt-6.2-sol',
      suggestions: [],
      pendingSuggestions: 0,
      enrichmentRequests: [],
      enrichmentCredits: 0, // no credit system: previously 1000 invented credits
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
          activeRules: state.automationRules.find((r) => r.id === id)?.isActive
            ? state.activeRules - 1
            : state.activeRules,
        }));
      },

      toggleAutomationRule: (id) => {
        set((state) => ({
          automationRules: state.automationRules.map((rule) =>
            rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
          ),
          activeRules: state.automationRules.find((r) => r.id === id)?.isActive
            ? state.activeRules - 1
            : state.activeRules + 1,
        }));
      },

      executeAutomationRule: async (id, _context = {}) => {
        const rule = get().automationRules.find((r) => r.id === id);
        if (!rule) return false;
        // There is no automation engine behind these client-side rules; previously this waited
        // a second and recorded a fake successful run
        console.warn(`Automation rule "${rule.name}" was not run: rule execution is not available yet`);
        return false;
      },

      // AI Insights Actions
      generateInsights: async () => {
        set((state) => ({
          loading: { ...state.loading, insights: true },
        }));

        try {
          const contacts = Object.values(useContactStore.getState().contacts || {}).slice(0, 50);
          const deals = Object.values(useDealStore.getState().deals || {}).slice(0, 50);
          if (contacts.length === 0 && deals.length === 0) {
            set((state) => ({ insights: [], newInsights: 0, loading: { ...state.loading, insights: false } }));
            return;
          }

          const result = await generateAI({
            prompt: `Find the most important sales insights in this CRM data. Only refer to records that appear below, by their id.
Contacts: ${JSON.stringify(contacts.map((c: any) => ({ id: c.id, name: c.name, company: c.company, status: c.status, aiScore: c.aiScore, lastConnected: c.lastConnected })))}
Deals: ${JSON.stringify(deals.map((d: any) => ({ id: d.id, title: d.title, value: d.value, stage: d.stage, probability: d.probability, dueDate: d.dueDate })))}`,
            schemaName: 'crm_insights',
            schema: {
              type: 'object',
              properties: {
                insights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['opportunity', 'risk', 'prediction', 'recommendation', 'anomaly'] },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      confidence: { type: 'number' },
                      impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                      category: { type: 'string', enum: ['sales', 'marketing', 'customer_service', 'operations', 'finance'] },
                      recommendations: { type: 'array', items: { type: 'string' } },
                      relatedEntities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { type: 'string', enum: ['contact', 'deal'] },
                            id: { type: 'string' },
                            name: { type: 'string' },
                          },
                          required: ['type', 'id', 'name'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['type', 'title', 'description', 'confidence', 'impact', 'category', 'recommendations', 'relatedEntities'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['insights'],
              additionalProperties: false,
            },
          });

          const now = new Date();
          const insights: AIInsight[] = (result.data?.insights || []).map((item: any, index: number) => ({
            id: `insight_${now.getTime()}_${index}`,
            type: item.type,
            title: item.title,
            description: item.description,
            confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
            impact: item.impact,
            category: item.category,
            data: { metrics: {}, trends: [], predictions: [], recommendations: item.recommendations || [] },
            actionable: (item.recommendations || []).length > 0,
            relatedEntities: item.relatedEntities || [],
            tags: [],
            createdAt: now,
            updatedAt: now,
            status: 'new',
          }));

          set((state) => ({
            insights,
            newInsights: insights.length,
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
          newInsights:
            state.insights.find((i) => i.id === id)?.status === 'new'
              ? state.newInsights - 1
              : state.newInsights,
        }));
      },

      actOnInsight: (id, action) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, status: 'acted_upon' } : insight
          ),
          newInsights:
            state.insights.find((i) => i.id === id)?.status === 'new'
              ? state.newInsights - 1
              : state.newInsights,
        }));
      },

      markInsightReviewed: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, status: 'reviewing' } : insight
          ),
          newInsights:
            state.insights.find((i) => i.id === id)?.status === 'new'
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
              monthly: [],
            },
          },
        };

        set((state) => ({
          workflows: [...state.workflows, newWorkflow],
        }));
      },

      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === id ? { ...workflow, ...updates, lastModified: new Date() } : workflow
          ),
        }));
      },

      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter((workflow) => workflow.id !== id),
        }));
      },

      executeWorkflow: async (id, context = {}) => {
        const workflow = get().workflows.find((w) => w.id === id);
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

        // There is no executor for these client-side workflows; previously a 3-second timer marked
        // every run "completed"
        const message = 'Workflow execution is not available yet';
        set((state) => ({
          workflowExecutions: state.workflowExecutions.map((exec) =>
            exec.id === executionId
              ? { ...exec, status: 'failed', endTime: new Date(), error: message }
              : exec
          ),
        }));
        throw new Error(message);
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
            exec.id === executionId ? { ...exec, status: 'cancelled', endTime: new Date() } : exec
          ),
        }));
      },

      // Smart Suggestions Actions
      generateSuggestions: async (context) => {
        set((state) => ({
          loading: { ...state.loading, suggestions: true },
        }));

        try {
          const result = await generateAI({
            prompt: `Suggest the next best CRM actions for this ${context.entityType}.
Context: ${JSON.stringify(context)}`,
            schemaName: 'crm_suggestions',
            schema: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['email_reply', 'task_creation', 'deal_action', 'contact_update', 'meeting_scheduling'] },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      preview: { type: 'string' },
                      confidence: { type: 'number' },
                      reasoning: { type: 'string' },
                    },
                    required: ['type', 'title', 'description', 'preview', 'confidence', 'reasoning'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['suggestions'],
              additionalProperties: false,
            },
          });

          const now = new Date();
          const suggestions: SmartSuggestion[] = (result.data?.suggestions || []).map((item: any, index: number) => ({
            id: `suggestion_${now.getTime()}_${index}`,
            type: item.type,
            title: item.title,
            description: item.description,
            context,
            action: { type: item.type, config: {}, preview: item.preview },
            confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
            reasoning: item.reasoning,
            aiModel: result.model,
            createdAt: now,
            status: 'pending',
          }));

          set((state) => ({
            suggestions: [...suggestions, ...state.suggestions],
            pendingSuggestions: state.pendingSuggestions + suggestions.length,
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
        const suggestion = get().suggestions.find((s) => s.id === id);
        if (!suggestion) return;

        try {
          // Records the user's choice (the suggestion itself is carried out by the user)
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
          suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, feedback } : s)),
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
          if (request.entityType !== 'contact') {
            throw new Error(`Enrichment for ${request.entityType} records is not available yet`);
          }
          // Real enrichment: the server researches the contact with web search
          const response = await fetch(`/api/contacts/${request.entityId}/enrich`, { method: 'POST' });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body.data) {
            throw new Error(body.message || body.error || `Enrichment failed (${response.status})`);
          }
          const now = new Date();
          const results = Object.entries(body.data)
            .filter(([field]) => field !== 'sources')
            .filter(([field]) => !request.requestedFields?.length || request.requestedFields.includes(field))
            .map(([field, value]) => ({
              field,
              value,
              confidence: 0, // the AI does not report a per-field confidence
              source: 'openai_web_search',
              lastUpdated: now,
              verified: false,
            }));

          set((state) => ({
            enrichmentRequests: state.enrichmentRequests.map((req) =>
              req.id === enrichmentRequest.id
                ? { ...req, status: 'completed', completedAt: now, results }
                : req
            ),
            loading: { ...state.loading, enrichment: false },
          }));

          return enrichmentRequest.id;
        } catch (error: any) {
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
        const request = get().enrichmentRequests.find((r) => r.id === id);
        if (!request) throw new Error('Enrichment request not found');
        return request;
      },

      purchaseEnrichmentCredits: async (_amount) => {
        // No credit purchase exists here; previously this added credits without any payment
        throw new Error('Buying enrichment credits is not available');
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
            trend: 'stable',
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
        const model = get().models.find((m) => m.id === id);
        if (!model) throw new Error('Model not found');

        const result = await generateAI({
          prompt,
          tier: /sol|advanced/i.test(`${model.id} ${model.name}`) ? 'advanced' : 'default',
        });
        return result.content;
      },

      // Settings Actions
      updateSetting: (id, value) => {
        set((state) => ({
          settings: state.settings.map((setting) =>
            setting.id === id ? { ...setting, value, lastModified: new Date() } : setting
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
        const activeRules = automationRules.filter((rule) => rule.isActive).length;
        const totalExecutions = automationRules.reduce((sum, rule) => sum + rule.executionCount, 0);
        const successRate =
          automationRules.length > 0
            ? automationRules.reduce((sum, rule) => sum + rule.successRate, 0) /
              automationRules.length
            : 0;

        return {
          totalRules: automationRules.length,
          activeRules,
          // Rules last run today (per-run history is not stored)
          executionsToday: automationRules.filter(
            (rule) => rule.lastExecuted && new Date(rule.lastExecuted).toDateString() === new Date().toDateString()
          ).length,
          successRate,
          topPerformingRules: automationRules
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5),
        };
      },

      getWorkflowAnalytics: () => {
        const { workflows, workflowExecutions } = get();
        const activeWorkflows = workflows.filter((w) => w.isActive).length;
        const completedExecutions = workflowExecutions.filter((e) => e.status === 'completed');
        const averageDuration =
          completedExecutions.length > 0
            ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
              completedExecutions.length
            : 0;

        return {
          totalWorkflows: workflows.length,
          activeWorkflows,
          executionsThisWeek: workflowExecutions.filter(
            (e) => e.startTime > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          averageDuration,
          mostUsedWorkflows: workflows
            .sort((a, b) => b.analytics.totalExecutions - a.analytics.totalExecutions)
            .slice(0, 5),
        };
      },
    }),
    {
      name: 'ai-integration-store',
    }
  )
);
