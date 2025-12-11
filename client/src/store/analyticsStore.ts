import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AnalyticsData,
  SalesMetrics,
  PipelineMetrics,
  TaskMetrics,
  CommunicationMetrics,
  PerformanceMetrics,
  FinancialMetrics,
  ReportTemplate,
  Dashboard,
  AnalyticsInsight,
  ForecastData,
  BenchmarkData
} from '../types/analytics';

interface AnalyticsStore {
  // State
  data: AnalyticsData[];
  salesMetrics: SalesMetrics;
  pipelineMetrics: PipelineMetrics;
  taskMetrics: TaskMetrics;
  communicationMetrics: CommunicationMetrics;
  performanceMetrics: PerformanceMetrics;
  financialMetrics: FinancialMetrics;
  reportTemplates: ReportTemplate[];
  dashboards: Dashboard[];
  insights: AnalyticsInsight[];
  forecasts: ForecastData[];
  benchmarks: BenchmarkData[];
  
  // Filters
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  customRange: { start: Date; end: Date } | null;
  
  // Actions
  updateMetrics: () => void;
  addAnalyticsData: (data: Omit<AnalyticsData, 'id' | 'timestamp'>) => void;
  
  // Report Actions
  createReportTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReportTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  deleteReportTemplate: (id: string) => void;
  generateReport: (templateId: string) => Promise<any>;
  scheduleReport: (templateId: string, schedule: any) => void;
  
  // Dashboard Actions
  createDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  setDefaultDashboard: (id: string) => void;
  
  // Insights & Forecasting
  generateInsights: () => Promise<AnalyticsInsight[]>;
  generateForecast: (metric: string, period: number) => Promise<ForecastData>;
  getBenchmarks: (metric: string) => Promise<BenchmarkData>;
  
  // Utilities
  setTimeRange: (range: '7d' | '30d' | '90d' | '1y' | 'custom', customRange?: { start: Date; end: Date }) => void;
  exportData: (format: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
  getMetricTrend: (metric: string) => number;
  compareWithPrevious: (metric: string) => { value: number; change: number; changePercent: number };
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      data: [],
      salesMetrics: {
        totalRevenue: 0,
        newRevenue: 0,
        recurringRevenue: 0,
        averageDealSize: 0,
        conversionRate: 0,
        salesCycle: 0,
        winRate: 0,
        totalDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        activeDeals: 0,
        forecastedRevenue: 0,
        quotaAttainment: 0,
        trendsData: []
      },
      pipelineMetrics: {
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        dealsByStage: [],
        averageTimeInStage: [],
        stageConversionRates: [],
        pipelineVelocity: 0,
        pipelineHealth: 'fair',
        bottlenecks: [],
        trendsData: []
      },
      taskMetrics: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        averageTaskDuration: 0,
        tasksByPriority: [],
        tasksByType: [],
        productivityScore: 0,
        trendsData: []
      },
      communicationMetrics: {
        totalCommunications: 0,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        emailsReplied: 0,
        callsMade: 0,
        callsConnected: 0,
        meetingsScheduled: 0,
        responseRate: 0,
        engagementRate: 0,
        trendsData: []
      },
      performanceMetrics: {
        userActivityScore: 0,
        dailyActiveUsers: 0,
        featureUsage: [],
        systemPerformance: {
          avgResponseTime: 0,
          uptime: 0,
          errorRate: 0
        },
        dataQuality: {
          completeness: 0,
          accuracy: 0,
          consistency: 0
        }
      },
      financialMetrics: {
        revenue: { current: 0, previous: 0, growth: 0 },
        costs: { acquisition: 0, retention: 0, support: 0 },
        profitability: { gross: 0, net: 0, margin: 0 },
        forecasting: { nextMonth: 0, nextQuarter: 0, confidence: 0 }
      },
      reportTemplates: [],
      dashboards: [],
      insights: [],
      forecasts: [],
      benchmarks: [],
      timeRange: '30d',
      customRange: null,
      
      // Actions
      updateMetrics: () => {
        // This would typically pull data from other stores
        // For now, we'll generate mock data
        const mockSalesMetrics: SalesMetrics = {
          totalRevenue: 125000,
          newRevenue: 45000,
          recurringRevenue: 80000,
          averageDealSize: 2500,
          conversionRate: 0.15,
          salesCycle: 45,
          winRate: 0.35,
          totalDeals: 50,
          wonDeals: 18,
          lostDeals: 12,
          activeDeals: 20,
          forecastedRevenue: 180000,
          quotaAttainment: 0.85,
          trendsData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 5000) + 2000
          }))
        };
        
        const mockPipelineMetrics: PipelineMetrics = {
          totalPipelineValue: 350000,
          weightedPipelineValue: 210000,
          dealsByStage: [
            { stage: 'Prospecting', count: 25, value: 62500 },
            { stage: 'Qualification', count: 18, value: 45000 },
            { stage: 'Proposal', count: 12, value: 30000 },
            { stage: 'Negotiation', count: 8, value: 20000 },
            { stage: 'Closed Won', count: 5, value: 12500 }
          ],
          averageTimeInStage: [
            { stage: 'Prospecting', days: 14 },
            { stage: 'Qualification', days: 21 },
            { stage: 'Proposal', days: 18 },
            { stage: 'Negotiation', days: 12 },
            { stage: 'Closed Won', days: 3 }
          ],
          stageConversionRates: [
            { stage: 'Prospecting', rate: 0.72 },
            { stage: 'Qualification', rate: 0.67 },
            { stage: 'Proposal', rate: 0.67 },
            { stage: 'Negotiation', rate: 0.63 }
          ],
          pipelineVelocity: 2.1,
          pipelineHealth: 'good',
          bottlenecks: [
            {
              stage: 'Qualification',
              averageDays: 21,
              threshold: 14,
              severity: 'medium',
              suggestions: ['Follow up more frequently', 'Improve qualification criteria']
            }
          ],
          trendsData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.floor(Math.random() * 20000) + 300000
          }))
        };
        
        set({
          salesMetrics: mockSalesMetrics,
          pipelineMetrics: mockPipelineMetrics
        });
      },
      
      addAnalyticsData: (dataPoint) => {
        const newData: AnalyticsData = {
          ...dataPoint,
          id: crypto.randomUUID(),
          timestamp: new Date()
        };
        
        set((state) => ({
          data: [newData, ...state.data]
        }));
      },
      
      // Report Actions
      createReportTemplate: (templateData) => {
        const template: ReportTemplate = {
          ...templateData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          reportTemplates: [...state.reportTemplates, template]
        }));
      },
      
      updateReportTemplate: (id, updates) => {
        set((state) => ({
          reportTemplates: state.reportTemplates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          )
        }));
      },
      
      deleteReportTemplate: (id) => {
        set((state) => ({
          reportTemplates: state.reportTemplates.filter((template) => template.id !== id)
        }));
      },
      
      generateReport: async (templateId) => {
        const template = get().reportTemplates.find((t) => t.id === templateId);
        if (!template) return null;
        
        // Mock report generation
        return {
          id: crypto.randomUUID(),
          templateId,
          data: get().salesMetrics,
          generatedAt: new Date(),
          format: 'json'
        };
      },
      
      scheduleReport: (templateId, schedule) => {
        get().updateReportTemplate(templateId, { schedule });
      },
      
      // Dashboard Actions
      createDashboard: (dashboardData) => {
        const dashboard: Dashboard = {
          ...dashboardData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          dashboards: [...state.dashboards, dashboard]
        }));
      },
      
      updateDashboard: (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((dashboard) =>
            dashboard.id === id
              ? { ...dashboard, ...updates, updatedAt: new Date() }
              : dashboard
          )
        }));
      },
      
      deleteDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter((dashboard) => dashboard.id !== id)
        }));
      },
      
      setDefaultDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.map((dashboard) => ({
            ...dashboard,
            isDefault: dashboard.id === id
          }))
        }));
      },
      
      // Insights & Forecasting
      generateInsights: async () => {
        const insights: AnalyticsInsight[] = [
          {
            id: crypto.randomUUID(),
            type: 'trend',
            title: 'Revenue Growth Trending Up',
            description: 'Revenue has increased 15% over the last 30 days',
            severity: 'medium',
            metric: 'revenue',
            value: 125000,
            confidence: 0.85,
            actionable: true,
            suggestions: ['Continue current sales strategies', 'Consider scaling successful campaigns'],
            createdAt: new Date()
          },
          {
            id: crypto.randomUUID(),
            type: 'anomaly',
            title: 'Pipeline Bottleneck Detected',
            description: 'Deals are staying in Qualification stage longer than usual',
            severity: 'high',
            metric: 'pipeline_velocity',
            value: 21,
            expectedValue: 14,
            confidence: 0.92,
            actionable: true,
            suggestions: ['Review qualification criteria', 'Provide additional training', 'Follow up more frequently'],
            createdAt: new Date()
          }
        ];
        
        set({ insights });
        return insights;
      },
      
      generateForecast: async (metric, period) => {
        const forecast: ForecastData = {
          metric,
          currentValue: 125000,
          forecastedValue: 145000,
          confidence: 0.78,
          methodology: 'linear',
          factors: ['historical_trend', 'seasonality', 'pipeline_strength'],
          scenarioAnalysis: {
            best: 165000,
            worst: 125000,
            likely: 145000
          },
          dateRange: {
            start: new Date(),
            end: new Date(Date.now() + period * 24 * 60 * 60 * 1000)
          }
        };
        
        set((state) => ({
          forecasts: [...state.forecasts.filter(f => f.metric !== metric), forecast]
        }));
        
        return forecast;
      },
      
      getBenchmarks: async (metric) => {
        const benchmark: BenchmarkData = {
          metric,
          value: 125000,
          industry: {
            average: 98000,
            top10: 185000,
            top25: 145000
          },
          company: {
            historical: [85000, 92000, 108000, 115000, 125000],
            trend: 'improving'
          },
          recommendations: [
            'Performance is above industry average',
            'Focus on reaching top 25% benchmark',
            'Continue current growth trajectory'
          ]
        };
        
        set((state) => ({
          benchmarks: [...state.benchmarks.filter(b => b.metric !== metric), benchmark]
        }));
        
        return benchmark;
      },
      
      // Utilities
      setTimeRange: (range, customRange) => {
        set({ timeRange: range, customRange });
      },
      
      exportData: async (format) => {
        // Mock export functionality
        const data = JSON.stringify(get().salesMetrics, null, 2);
        return new Blob([data], { type: 'application/json' });
      },
      
      getMetricTrend: (metric) => {
        // Calculate trend based on recent data
        const recentData = get().data
          .filter(d => d.metric === metric)
          .slice(0, 7);
        
        if (recentData.length < 2) return 0;
        
        const latest = recentData[0].value;
        const previous = recentData[recentData.length - 1].value;
        
        return ((latest - previous) / previous) * 100;
      },
      
      compareWithPrevious: (metric) => {
        const current = get().salesMetrics.totalRevenue; // Example
        const previous = current * 0.85; // Mock previous value
        const change = current - previous;
        const changePercent = (change / previous) * 100;
        
        return {
          value: current,
          change,
          changePercent
        };
      }
    }),
    {
      name: 'analytics-store',
      partialize: (state) => ({
        data: state.data,
        reportTemplates: state.reportTemplates,
        dashboards: state.dashboards,
        insights: state.insights,
        forecasts: state.forecasts,
        benchmarks: state.benchmarks
      })
    }
  )
);
