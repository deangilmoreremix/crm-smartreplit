import { z } from 'zod';

// ============================================================================
// WIDGET TYPES
// ============================================================================

export type WidgetSize = '1x1' | '2x1' | '2x2' | '3x2' | '3x3' | '4x2';
export type WidgetType = 'metric' | 'chart' | 'table' | 'list' | 'kpi' | 'progress' | 'activity';
export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';

export const WidgetSizeSchema = z.enum(['1x1', '2x1', '2x2', '3x2', '3x3', '4x2']);
export type WidgetSizeSchema = z.infer<typeof WidgetSizeSchema>;

export const WidgetTypeSchema = z.enum([
  'metric',
  'chart',
  'table',
  'list',
  'kpi',
  'progress',
  'activity',
]);
export type WidgetTypeSchema = z.infer<typeof WidgetTypeSchema>;

export const ChartTypeSchema = z.enum(['line', 'bar', 'pie', 'donut', 'area', 'scatter']);
export type ChartTypeSchema = z.infer<typeof ChartTypeSchema>;

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: WidgetPosition;
  dataSource?: string;
  refreshInterval?: number; // seconds, 0 = no auto-refresh
  showHeader?: boolean;
  expandable?: boolean;
  actions?: WidgetAction[];
  settings?: Record<string, any>;
}

export interface WidgetAction {
  id: string;
  label: string;
  icon?: string;
  action: 'refresh' | 'export' | 'configure' | 'remove' | 'custom';
  handler?: () => void;
}

// Metric widget specific
export interface MetricWidgetData {
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  target?: number;
  thresholds?: {
    warning: number;
    critical: number;
  };
  format?: 'currency' | 'number' | 'percent' | 'duration';
}

// Chart widget specific
export interface ChartWidgetData {
  chartType: ChartType;
  data: ChartDataPoint[];
  xAxisKey?: string;
  yAxisKeys?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: any;
}

// Table widget specific
export interface TableWidgetData {
  columns: TableColumn[];
  rows: Record<string, any>[];
  pagination?: {
    pageSize: number;
    currentPage: number;
    total: number;
  };
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  rowActions?: TableRowAction[];
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'avatar';
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

export interface TableRowAction {
  id: string;
  label: string;
  icon?: string;
  handler: (row: Record<string, any>) => void;
  variant?: 'default' | 'destructive' | 'outline';
}

// List widget specific
export interface ListWidgetData {
  items: ListItem[];
  maxItems?: number;
  showAvatar?: boolean;
  compact?: boolean;
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  icon?: string;
  badge?: string | number;
  timestamp?: Date | string;
  actions?: ListItemAction[];
  onClick?: () => void;
}

export interface ListItemAction {
  id: string;
  label: string;
  icon?: string;
  handler: () => void;
  variant?: 'default' | 'ghost' | 'outline';
}

// Progress widget specific
export interface ProgressWidgetData {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// Activity widget specific
export interface ActivityWidgetData {
  activities: ActivityItem[];
  groupByDate?: boolean;
  maxItems?: number;
}

export interface ActivityItem {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'deal' | 'task' | 'note' | 'system';
  title: string;
  description?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  userId?: string;
  tenantId?: string;
  widgets: WidgetConfig[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DashboardSettings {
  userId: string;
  defaultDashboardId?: string;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  timezone: string;
  dateFormat: string;
  compactMode: boolean;
  animationEnabled: boolean;
  widgetSpacing: 'tight' | 'normal' | 'loose';
}

export interface DashboardSubscription {
  widgetId: string;
  dataSource: string;
  lastFetched: Date | string;
  nextFetch?: Date | string;
  error?: string;
}

// ============================================================================
// DASHBOARD STATE
// ============================================================================

export interface DashboardState {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  settings: DashboardSettings | null;
  subscriptions: DashboardSubscription[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | string;
}

// ============================================================================
// DASHBOARD ACTIONS
// ============================================================================

export type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_LAYOUT'; payload: string }
  | { type: 'LOAD_LAYOUTS'; payload: DashboardLayout[] }
  | { type: 'ADD_WIDGET'; payload: { layoutId: string; widget: WidgetConfig } }
  | {
      type: 'UPDATE_WIDGET';
      payload: { layoutId: string; widgetId: string; updates: Partial<WidgetConfig> };
    }
  | { type: 'REMOVE_WIDGET'; payload: { layoutId: string; widgetId: string } }
  | {
      type: 'MOVE_WIDGET';
      payload: { layoutId: string; widgetId: string; position: WidgetPosition };
    }
  | { type: 'RESIZE_WIDGET'; payload: { layoutId: string; widgetId: string; size: WidgetSize } }
  | { type: 'REORDER_WIDGETS'; payload: { layoutId: string; widgetIds: string[] } }
  | { type: 'CREATE_LAYOUT'; payload: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_LAYOUT'; payload: { layoutId: string; updates: Partial<DashboardLayout> } }
  | { type: 'DELETE_LAYOUT'; payload: string }
  | { type: 'SET_DEFAULT_LAYOUT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<DashboardSettings> }
  | { type: 'LOAD_SUBSCRIPTIONS'; payload: DashboardSubscription[] }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: DashboardSubscription }
  | { type: 'MARK_UPDATED' };

// ============================================================================
// DASHBOARD PERSISTENCE
// ============================================================================

export interface DashboardPersistenceConfig {
  userId: string;
  tenantId?: string;
  supabase: any;
  storageKey?: string;
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
}

// Export/Import
export interface DashboardExport {
  version: string;
  exportedAt: Date | string;
  layouts: DashboardLayout[];
  settings: DashboardSettings | null;
}

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

export type DateRangePreset =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'this-quarter'
  | 'this-year'
  | 'ytd'
  | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: Date | string;
  endDate: Date | string;
  label: string;
}

// ============================================================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionEventType = 'data_update' | 'widget_refresh' | 'layout_change' | 'error';

export interface SubscriptionEvent {
  type: SubscriptionEventType;
  widgetId?: string;
  layoutId?: string;
  userId?: string;
  timestamp: Date | string;
  payload?: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type dashboardWidgetDataMap = {
  metric: MetricWidgetData;
  chart: ChartWidgetData;
  table: TableWidgetData;
  list: ListWidgetData;
  kpi: MetricWidgetData;
  progress: ProgressWidgetData;
  activity: ActivityWidgetData;
};

export function getDefaultWidgetSize(type: WidgetType): WidgetSize {
  switch (type) {
    case 'metric':
      return '1x1';
    case 'kpi':
      return '1x1';
    case 'chart':
      return '2x2';
    case 'table':
      return '3x2';
    case 'list':
      return '2x1';
    case 'progress':
      return '1x1';
    case 'activity':
      return '2x2';
    default:
      return '1x1';
  }
}

export function isWidgetData(
  data: any,
  type: WidgetType
): data is
  | MetricWidgetData
  | ChartWidgetData
  | TableWidgetData
  | ListWidgetData
  | ProgressWidgetData
  | ActivityWidgetData {
  // Runtime type guard - can be expanded as needed
  return data !== null && typeof data === 'object';
}
