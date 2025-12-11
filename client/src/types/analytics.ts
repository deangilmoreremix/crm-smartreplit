export interface AnalyticsData {
  id: string;
  metric: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  timestamp: Date;
  category: 'sales' | 'pipeline' | 'tasks' | 'communication' | 'performance' | 'financial';
}

export interface SalesMetrics {
  totalRevenue: number;
  newRevenue: number;
  recurringRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  salesCycle: number; // days
  winRate: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  forecastedRevenue: number;
  quotaAttainment: number;
  trendsData: TrendData[];
}

export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  dealsByStage: { stage: string; count: number; value: number }[];
  averageTimeInStage: { stage: string; days: number }[];
  stageConversionRates: { stage: string; rate: number }[];
  pipelineVelocity: number;
  pipelineHealth: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: PipelineBottleneck[];
  trendsData: TrendData[];
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  tasksByPriority: { priority: string; count: number }[];
  tasksByType: { type: string; count: number }[];
  productivityScore: number;
  trendsData: TrendData[];
}

export interface CommunicationMetrics {
  totalCommunications: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  callsMade: number;
  callsConnected: number;
  meetingsScheduled: number;
  responseRate: number;
  engagementRate: number;
  trendsData: TrendData[];
}

export interface PerformanceMetrics {
  userActivityScore: number;
  dailyActiveUsers: number;
  featureUsage: { feature: string; usage: number }[];
  systemPerformance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}

export interface FinancialMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  costs: {
    acquisition: number;
    retention: number;
    support: number;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
  };
  forecasting: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface PipelineBottleneck {
  stage: string;
  averageDays: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'sales' | 'pipeline' | 'tasks' | 'communication' | 'performance' | 'financial' | 'custom';
  metrics: string[];
  filters: ReportFilter[];
  visualization: 'table' | 'chart' | 'graph' | 'mixed';
  schedule?: ReportSchedule;
  recipients?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  label?: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  isActive: boolean;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
  isDefault: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'progress' | 'text';
  title: string;
  dataSource: string;
  config: WidgetConfig;
  refreshInterval?: number; // minutes
}

export interface WidgetConfig {
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  timeRange?: '7d' | '30d' | '90d' | '1y';
  filters?: ReportFilter[];
  columns?: string[];
  limit?: number;
  color?: string;
  showTrend?: boolean;
  showComparison?: boolean;
}

export interface WidgetLayout {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  expectedValue?: number;
  confidence: number;
  actionable: boolean;
  suggestions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface ForecastData {
  metric: string;
  currentValue: number;
  forecastedValue: number;
  confidence: number;
  methodology: 'linear' | 'exponential' | 'seasonal' | 'ml';
  factors: string[];
  scenarioAnalysis: {
    best: number;
    worst: number;
    likely: number;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface BenchmarkData {
  metric: string;
  value: number;
  industry: {
    average: number;
    top10: number;
    top25: number;
  };
  company: {
    historical: number[];
    trend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
}
