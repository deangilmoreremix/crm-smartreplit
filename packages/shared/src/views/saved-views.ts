import { ViewFilter, ViewSort } from '../types';

export type ViewType = 'table' | 'kanban' | 'calendar';

export interface ColumnConfig {
  field: string;
  label: string;
  width?: number;
  sortable?: boolean;
  visible?: boolean;
  aggregation?: AggregationType;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface KanbanColumnConfig {
  id: string;
  field: string;
  label: string;
  collapsed?: boolean;
  order?: number;
}

export interface SavedViewConfig {
  id: string;
  name: string;
  viewType: ViewType;
  filters: ViewFilter[];
  sortOrder: ViewSort[];
  columns: ColumnConfig[];
  kanbanColumns?: KanbanColumnConfig[];
  isDefault?: boolean;
  isShared?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewPreset {
  id: string;
  name: string;
  icon?: string;
  filters: ViewFilter[];
  sortOrder?: ViewSort[];
  viewType?: ViewType;
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  label?: string;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterGroup {
  id: string;
  logic: 'and' | 'or';
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

export function createEmptyFilterGroup(logic: 'and' | 'or' = 'and'): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic,
    conditions: [],
    groups: [],
  };
}

export function createFilterCondition(
  field: string,
  operator: FilterOperator,
  value: any
): FilterCondition {
  return { field, operator, value };
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'not equals',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  gt: 'greater than',
  gte: 'greater than or equal',
  lt: 'less than',
  lte: 'less than or equal',
  between: 'between',
  in: 'in',
  not_in: 'not in',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export const AGGREGATION_LABELS: Record<AggregationType, string> = {
  sum: 'Sum',
  avg: 'Average',
  count: 'Count',
  min: 'Min',
  max: 'Max',
};
