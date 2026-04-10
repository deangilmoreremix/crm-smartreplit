// Re-export all types from schema
export * from '../schema';

// Additional shared types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterCondition {
  field: string;
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'between';
  value: any;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// View types
export interface ViewFilter {
  field: string;
  operator: string;
  value: any;
}

export interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}

// Workflow types
export interface WorkflowTriggerConfig {
  type: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED' | 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
  object?: string;
  conditions?: FilterCondition[];
  schedule?: string; // cron expression for scheduled
  webhookUrl?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'ACTION' | 'CONDITION' | 'DELAY' | 'ITERATOR';
  name: string;
  config: Record<string, any>;
  nextSteps?: string[];
}

// Kanban types
export interface KanbanColumn {
  id: string;
  title: string;
  value: string;
  count: number;
  aggregation?: {
    field: string;
    type: 'sum' | 'avg' | 'min' | 'max' | 'count';
    value: number;
  };
}

export interface KanbanCard {
  id: string;
  title: string;
  data: Record<string, any>;
  position: number;
}

// AI types
export interface AIAgentConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  permissions: string[];
}

// Metadata types
export interface FieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
}

export interface FieldSettings {
  min?: number;
  max?: number;
  step?: number;
  format?: string;
}
