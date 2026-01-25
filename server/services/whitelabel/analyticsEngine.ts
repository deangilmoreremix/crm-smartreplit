/**
 * Analytics Engine Service
 * Handles metrics collection, report generation, and analytics processing
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '../errorLogger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface Metric {
  id: string;
  tenantId: string;
  metricType: string;
  metricValue: number;
  metadata: Record<string, any>;
  recordedAt: Date;
}

export interface Report {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  config: ReportConfig;
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom' | 'manual';
  lastGeneratedAt?: Date;
  nextGenerationAt?: Date;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel' | 'json';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  metrics: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, any>;
  charts?: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    metric: string;
    title: string;
  }>;
}

export interface AnalyticsSummary {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalContacts: number;
    totalDeals: number;
    totalRevenue: number;
    conversionRate: number;
    avgDealValue: number;
    avgResponseTime: number;
  };
  trends: {
    usersGrowth: number;
    revenueGrowth: number;
    dealsGrowth: number;
  };
  topPerformers: {
    users: Array<{ id: string; name: string; value: number }>;
    deals: Array<{ id: string; title: string; value: number }>;
  };
}

class AnalyticsEngine {
  /**
   * Record metric
   */
  async recordMetric(
    tenantId: string,
    metricType: string,
    metricValue: number,
    metadata?: Record<string, any>
  ): Promise<Metric> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('analytics_metrics')
        .insert({
          tenant_id: tenantId,
          metric_type: metricType,
          metric_value: metricValue,
          metadata: metadata || {},
          recorded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record metric: ${error.message}`);
      }

      return this.mapDatabaseToMetric(data);

    } catch (error: any) {
      await errorLogger.logError('Metric recording failed', error, {
        tenantId,
        metricType
      });
      throw error;
    }
  }

  /**
   * Get metrics for tenant
   */
  async getMetrics(
    tenantId: string,
    metricType?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Metric[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    let query = supabase
      .from('analytics_metrics')
      .select('*')
      .eq('tenant_id', tenantId);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    if (startDate) {
      query = query.gte('recorded_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('recorded_at', endDate.toISOString());
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToMetric(d));
  }

  /**
   * Get analytics summary for tenant
   */
  async getAnalyticsSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsSummary> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get user metrics
      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('id', tenantId); // In multi-tenant, filter by tenant

      // Get contact metrics
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, created_at')
        .eq('profile_id', tenantId);

      // Get deal metrics
      const { data: deals } = await supabase
        .from('deals')
        .select('id, title, value, status, created_at')
        .eq('profile_id', tenantId);

      // Calculate metrics
      const totalUsers = users?.length || 0;
      const totalContacts = contacts?.length || 0;
      const totalDeals = deals?.length || 0;
      
      const wonDeals = deals?.filter(d => d.status === 'won') || [];
      const totalRevenue = wonDeals.reduce((sum, deal) => sum + parseFloat(deal.value || '0'), 0);
      const avgDealValue = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
      const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;

      // Calculate trends (compare with previous period)
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodDuration);
      const previousEnd = startDate;

      const previousContacts = contacts?.filter(c => 
        new Date(c.created_at) >= previousStart && new Date(c.created_at) < previousEnd
      ).length || 0;

      const previousDeals = deals?.filter(d => 
        new Date(d.created_at) >= previousStart && new Date(d.created_at) < previousEnd
      ).length || 0;

      const currentContacts = contacts?.filter(c => 
        new Date(c.created_at) >= startDate && new Date(c.created_at) <= endDate
      ).length || 0;

      const currentDeals = deals?.filter(d => 
        new Date(d.created_at) >= startDate && new Date(d.created_at) <= endDate
      ).length || 0;

      const usersGrowth = previousContacts > 0 
        ? ((currentContacts - previousContacts) / previousContacts) * 100 
        : 0;

      const dealsGrowth = previousDeals > 0 
        ? ((currentDeals - previousDeals) / previousDeals) * 100 
        : 0;

      // Top performers
      const topDeals = (deals || [])
        .sort((a, b) => parseFloat(b.value || '0') - parseFloat(a.value || '0'))
        .slice(0, 5)
        .map(d => ({
          id: d.id.toString(),
          title: d.title,
          value: parseFloat(d.value || '0')
        }));

      return {
        tenantId,
        period: {
          start: startDate,
          end: endDate
        },
        metrics: {
          totalUsers,
          activeUsers: totalUsers, // Would need last_active_at tracking
          totalContacts,
          totalDeals,
          totalRevenue,
          conversionRate,
          avgDealValue,
          avgResponseTime: 0 // Would need response time tracking
        },
        trends: {
          usersGrowth,
          revenueGrowth: 0, // Would need previous revenue data
          dealsGrowth
        },
        topPerformers: {
          users: [], // Would need user performance metrics
          deals: topDeals
        }
      };

    } catch (error: any) {
      await errorLogger.logError('Analytics summary generation failed', error, {
        tenantId
      });
      throw error;
    }
  }

  /**
   * Create report
   */
  async createReport(
    tenantId: string,
    name: string,
    config: ReportConfig,
    schedule: Report['schedule'],
    recipients: string[],
    format: Report['format'],
    createdBy: string,
    description?: string
  ): Promise<Report> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Calculate next generation time based on schedule
      const nextGenerationAt = this.calculateNextGeneration(schedule);

      const { data, error } = await supabase
        .from('analytics_reports')
        .insert({
          tenant_id: tenantId,
          name,
          description,
          config,
          schedule,
          recipients,
          format,
          next_generation_at: nextGenerationAt?.toISOString(),
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create report: ${error.message}`);
      }

      return this.mapDatabaseToReport(data);

    } catch (error: any) {
      await errorLogger.logError('Report creation failed', error, {
        tenantId,
        reportName: name
      });
      throw error;
    }
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string): Promise<{ data: any; format: string }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get report configuration
      const { data: reportData, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !reportData) {
        throw new Error('Report not found');
      }

      const report = this.mapDatabaseToReport(reportData);

      // Get analytics data based on report config
      const summary = await this.getAnalyticsSummary(
        report.tenantId,
        report.config.dateRange.start,
        report.config.dateRange.end
      );

      // Get detailed metrics
      const metrics = await this.getMetrics(
        report.tenantId,
        undefined,
        report.config.dateRange.start,
        report.config.dateRange.end
      );

      // Format data based on report format
      let formattedData: any;

      switch (report.format) {
        case 'json':
          formattedData = {
            report: {
              id: report.id,
              name: report.name,
              generatedAt: new Date().toISOString()
            },
            summary,
            metrics
          };
          break;

        case 'csv':
          formattedData = this.formatAsCSV(summary, metrics);
          break;

        case 'pdf':
        case 'excel':
          // Would integrate with PDF/Excel generation libraries
          formattedData = {
            message: `${report.format.toUpperCase()} generation not yet implemented`,
            summary,
            metrics
          };
          break;

        default:
          formattedData = { summary, metrics };
      }

      // Update last generated timestamp
      await supabase
        .from('analytics_reports')
        .update({
          last_generated_at: new Date().toISOString(),
          next_generation_at: this.calculateNextGeneration(report.schedule)?.toISOString()
        })
        .eq('id', reportId);

      return {
        data: formattedData,
        format: report.format
      };

    } catch (error: any) {
      await errorLogger.logError('Report generation failed', error, {
        reportId
      });
      throw error;
    }
  }

  /**
   * List reports for tenant
   */
  async listReports(tenantId: string): Promise<Report[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list reports: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToReport(d));
  }

  /**
   * Update report
   */
  async updateReport(reportId: string, updates: Partial<Report>): Promise<Report> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.config) dbUpdates.config = updates.config;
    if (updates.schedule) {
      dbUpdates.schedule = updates.schedule;
      dbUpdates.next_generation_at = this.calculateNextGeneration(updates.schedule)?.toISOString();
    }
    if (updates.recipients) dbUpdates.recipients = updates.recipients;
    if (updates.format) dbUpdates.format = updates.format;

    const { data, error } = await supabase
      .from('analytics_reports')
      .update(dbUpdates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update report: ${error.message}`);
    }

    return this.mapDatabaseToReport(data);
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('analytics_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  /**
   * Calculate next generation time based on schedule
   */
  private calculateNextGeneration(schedule: Report['schedule']): Date | null {
    if (schedule === 'manual') {
      return null;
    }

    const now = new Date();
    const next = new Date(now);

    switch (schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;

      case 'weekly':
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        break;

      case 'custom':
        // Would need custom schedule configuration
        next.setDate(next.getDate() + 7);
        break;
    }

    return next;
  }

  /**
   * Format data as CSV
   */
  private formatAsCSV(summary: AnalyticsSummary, metrics: Metric[]): string {
    let csv = 'Metric Type,Value,Recorded At\n';

    // Add summary metrics
    csv += `Total Users,${summary.metrics.totalUsers},${new Date().toISOString()}\n`;
    csv += `Active Users,${summary.metrics.activeUsers},${new Date().toISOString()}\n`;
    csv += `Total Contacts,${summary.metrics.totalContacts},${new Date().toISOString()}\n`;
    csv += `Total Deals,${summary.metrics.totalDeals},${new Date().toISOString()}\n`;
    csv += `Total Revenue,${summary.metrics.totalRevenue},${new Date().toISOString()}\n`;
    csv += `Conversion Rate,${summary.metrics.conversionRate}%,${new Date().toISOString()}\n`;
    csv += `Avg Deal Value,${summary.metrics.avgDealValue},${new Date().toISOString()}\n`;

    // Add detailed metrics
    metrics.forEach(metric => {
      csv += `${metric.metricType},${metric.metricValue},${metric.recordedAt.toISOString()}\n`;
    });

    return csv;
  }

  /**
   * Process scheduled reports
   */
  async processScheduledReports(): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      // Get reports due for generation
      const { data: reports, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .lte('next_generation_at', new Date().toISOString())
        .neq('schedule', 'manual');

      if (error) {
        throw error;
      }

      if (!reports || reports.length === 0) {
        return;
      }

      // Generate each report
      for (const reportData of reports) {
        try {
          await this.generateReport(reportData.id);
          
          // In production, send report to recipients
          console.log(`Report generated: ${reportData.name} for tenant ${reportData.tenant_id}`);

        } catch (error: any) {
          await errorLogger.logError('Scheduled report generation failed', error, {
            reportId: reportData.id
          });
        }
      }

    } catch (error: any) {
      await errorLogger.logError('Scheduled report processing failed', error);
    }
  }

  /**
   * Export data in specified format
   */
  async exportData(
    tenantId: string,
    dataType: 'contacts' | 'deals' | 'tasks' | 'all',
    format: 'csv' | 'json' | 'excel'
  ): Promise<{ data: any; format: string; filename: string }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      let exportData: any = {};

      // Get data based on type
      if (dataType === 'contacts' || dataType === 'all') {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('profile_id', tenantId);
        exportData.contacts = contacts || [];
      }

      if (dataType === 'deals' || dataType === 'all') {
        const { data: deals } = await supabase
          .from('deals')
          .select('*')
          .eq('profile_id', tenantId);
        exportData.deals = deals || [];
      }

      if (dataType === 'tasks' || dataType === 'all') {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('profile_id', tenantId);
        exportData.tasks = tasks || [];
      }

      // Format data
      let formattedData: any;
      let filename: string;

      switch (format) {
        case 'json':
          formattedData = JSON.stringify(exportData, null, 2);
          filename = `${dataType}-export-${Date.now()}.json`;
          break;

        case 'csv':
          formattedData = this.convertToCSV(exportData);
          filename = `${dataType}-export-${Date.now()}.csv`;
          break;

        case 'excel':
          // Would integrate with ExcelJS
          formattedData = exportData;
          filename = `${dataType}-export-${Date.now()}.xlsx`;
          break;

        default:
          formattedData = exportData;
          filename = `${dataType}-export-${Date.now()}.json`;
      }

      return {
        data: formattedData,
        format,
        filename
      };

    } catch (error: any) {
      await errorLogger.logError('Data export failed', error, {
        tenantId,
        dataType,
        format
      });
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: Record<string, any[]>): string {
    let csv = '';

    for (const [tableName, records] of Object.entries(data)) {
      if (records.length === 0) continue;

      csv += `\n${tableName.toUpperCase()}\n`;
      
      // Headers
      const headers = Object.keys(records[0]);
      csv += headers.join(',') + '\n';

      // Rows
      records.forEach(record => {
        const values = headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(',') + '\n';
      });
    }

    return csv;
  }

  /**
   * Map database record to Metric
   */
  private mapDatabaseToMetric(data: any): Metric {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      metricType: data.metric_type,
      metricValue: parseFloat(data.metric_value),
      metadata: data.metadata || {},
      recordedAt: new Date(data.recorded_at)
    };
  }

  /**
   * Map database record to Report
   */
  private mapDatabaseToReport(data: any): Report {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      config: data.config,
      schedule: data.schedule,
      lastGeneratedAt: data.last_generated_at ? new Date(data.last_generated_at) : undefined,
      nextGenerationAt: data.next_generation_at ? new Date(data.next_generation_at) : undefined,
      recipients: data.recipients || [],
      format: data.format,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

// Export singleton instance
export const analyticsEngine = new AnalyticsEngine();
