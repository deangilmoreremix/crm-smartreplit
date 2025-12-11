// AI Integration & Automation Types
export interface AIAutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface AutomationTrigger {
  type: 'email_received' | 'deal_stage_change' | 'task_completed' | 'contact_created' | 'scheduled_time' | 'webhook' | 'api_call';
  config: Record<string, any>;
  schedule?: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
    cron?: string;
    timezone: string;
  };
}

export interface AutomationCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface AutomationAction {
  id: string;
  type: 'send_email' | 'create_task' | 'update_deal' | 'add_tag' | 'webhook' | 'ai_analysis' | 'data_enrichment' | 'notification';
  config: Record<string, any>;
  delay?: number; // in minutes
  retryConfig?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
  };
}

// AI-Powered Insights
export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'prediction' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'sales' | 'marketing' | 'customer_service' | 'operations' | 'finance';
  data: {
    metrics: Record<string, number>;
    trends: TrendData[];
    predictions: PredictionData[];
    recommendations: string[];
  };
  actionable: boolean;
  deadline?: Date;
  relatedEntities: {
    type: 'contact' | 'deal' | 'company' | 'task';
    id: string;
    name: string;
  }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'new' | 'reviewing' | 'acted_upon' | 'dismissed';
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface PredictionData {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

// AI Workflow Builder
export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'support' | 'operations';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
  template: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  executionHistory: WorkflowExecution[];
  analytics: WorkflowAnalytics;
  permissions: WorkflowPermission[];
}

export interface WorkflowStep {
  id: string;
  type: 'condition' | 'action' | 'delay' | 'approval' | 'ai_task' | 'human_task';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected steps
  aiConfig?: {
    model: string;
    prompt: string;
    parameters: Record<string, any>;
    fallback?: string;
  };
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook' | 'api';
  config: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stepResults: StepResult[];
  error?: string;
  triggeredBy: string;
  context: Record<string, any>;
}

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  logs: string[];
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  lastExecution?: Date;
  errorRate: number;
  mostFailedStep?: string;
  performance: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface WorkflowPermission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  canExecute: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// AI Model Management
export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  type: 'text' | 'image' | 'audio' | 'multimodal';
  version: string;
  description: string;
  capabilities: string[];
  pricing: {
    inputCost: number;
    outputCost: number;
    unit: 'token' | 'character' | 'request';
  };
  limits: {
    maxTokens: number;
    maxRequests: number;
    contextWindow: number;
  };
  config: Record<string, any>;
  isActive: boolean;
  usage: ModelUsage;
  createdAt: Date;
  lastUsed?: Date;
}

export interface ModelUsage {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  lastMonth: {
    requests: number;
    tokens: number;
    cost: number;
  };
  currentMonth: {
    requests: number;
    tokens: number;
    cost: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Smart Suggestions
export interface SmartSuggestion {
  id: string;
  type: 'email_reply' | 'task_creation' | 'deal_action' | 'contact_update' | 'meeting_scheduling';
  title: string;
  description: string;
  context: {
    entityType: 'contact' | 'deal' | 'task' | 'email';
    entityId: string;
    relevantData: Record<string, any>;
  };
  action: {
    type: string;
    config: Record<string, any>;
    preview?: string;
  };
  confidence: number;
  reasoning: string;
  aiModel: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'pending' | 'accepted' | 'dismissed' | 'expired';
  feedback?: {
    helpful: boolean;
    comment?: string;
    improvedVersion?: string;
  };
}

// AI Data Enrichment
export interface DataEnrichmentRequest {
  id: string;
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  requestedFields: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'clearbit' | 'zoominfo' | 'apollo' | 'ai_inference';
  results?: EnrichmentResult[];
  cost?: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface EnrichmentResult {
  field: string;
  value: any;
  confidence: number;
  source: string;
  lastUpdated: Date;
  verified: boolean;
}

// AI Integration Settings
export interface AIIntegrationSettings {
  id: string;
  category: 'general' | 'automation' | 'insights' | 'workflows' | 'enrichment';
  name: string;
  description: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  options?: any[];
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  isAdvanced: boolean;
  requiresRestart: boolean;
  lastModified: Date;
  modifiedBy: string;
}

// AI Training Data
export interface AITrainingData {
  id: string;
  type: 'conversation' | 'email' | 'document' | 'outcome';
  content: string;
  metadata: Record<string, any>;
  labels: string[];
  quality: 'high' | 'medium' | 'low';
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  usage: string[]; // Which models/features use this data
  privacy: 'public' | 'private' | 'restricted';
  createdAt: Date;
  source: string;
}
