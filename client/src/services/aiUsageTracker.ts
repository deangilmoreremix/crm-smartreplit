/**
 * AI Usage Tracking Service
 * Tracks AI tool usage, performance metrics, and analytics
 */

interface UsageRecord {
  toolId: string;
  toolName: string;
  category: string;
  timestamp: Date;
  userId?: string;
  customerId?: string;
  executionTime: number;
  success: boolean;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  provider?: string;
}

interface ToolMetrics {
  toolId: string;
  toolName: string;
  totalUsage: number;
  successRate: number;
  averageTime: number;
  lastUsed: Date;
  popularityScore: number;
  errorRate: number;
}

interface CategoryMetrics {
  category: string;
  totalUsage: number;
  toolCount: number;
  averageSuccessRate: number;
  mostUsedTool: string;
}

class AIUsageTracker {
  private usageHistory: UsageRecord[] = [];
  private metricsCache: Map<string, ToolMetrics> = new Map();
  private lastCacheUpdate: Date = new Date();

  /**
   * Track usage of an AI tool
   */
  async trackUsage(record: Omit<UsageRecord, 'timestamp'>): Promise<void> {
    const usageRecord: UsageRecord = {
      ...record,
      timestamp: new Date()
    };

    this.usageHistory.push(usageRecord);
    
    // Update metrics cache
    this.updateMetrics(record.toolId);
    
    // Store in localStorage for persistence
    this.persistToStorage();
    
    // Log analytics event
    console.log(`AI Tool Used: ${record.toolName} (${record.category}) - ${record.success ? 'Success' : 'Failed'} in ${record.executionTime}ms`);
  }

  /**
   * Get tool metrics
   */
  getToolMetrics(toolId: string): ToolMetrics | null {
    return this.metricsCache.get(toolId) || null;
  }

  /**
   * Get all tool metrics
   */
  getAllToolMetrics(): ToolMetrics[] {
    this.refreshMetrics();
    return Array.from(this.metricsCache.values()).sort((a, b) => b.totalUsage - a.totalUsage);
  }

  /**
   * Get category metrics
   */
  getCategoryMetrics(): CategoryMetrics[] {
    const categories = new Map<string, CategoryMetrics>();
    
    this.usageHistory.forEach(record => {
      const existing = categories.get(record.category);
      if (existing) {
        existing.totalUsage++;
      } else {
        categories.set(record.category, {
          category: record.category,
          totalUsage: 1,
          toolCount: 0,
          averageSuccessRate: 0,
          mostUsedTool: record.toolName
        });
      }
    });

    // Calculate additional metrics
    categories.forEach((metrics, category) => {
      const categoryRecords = this.usageHistory.filter(r => r.category === category);
      const uniqueTools = new Set(categoryRecords.map(r => r.toolId));
      const successCount = categoryRecords.filter(r => r.success).length;
      
      metrics.toolCount = uniqueTools.size;
      metrics.averageSuccessRate = (successCount / categoryRecords.length) * 100;
      
      // Find most used tool in category
      const toolUsage = new Map<string, number>();
      categoryRecords.forEach(record => {
        toolUsage.set(record.toolName, (toolUsage.get(record.toolName) || 0) + 1);
      });
      
      let maxUsage = 0;
      let mostUsed = '';
      toolUsage.forEach((usage, toolName) => {
        if (usage > maxUsage) {
          maxUsage = usage;
          mostUsed = toolName;
        }
      });
      metrics.mostUsedTool = mostUsed;
    });

    return Array.from(categories.values()).sort((a, b) => b.totalUsage - a.totalUsage);
  }

  /**
   * Get usage statistics for dashboard
   */
  getUsageStats(): {
    totalUsage: number;
    successRate: number;
    averageExecutionTime: number;
    activeTools: number;
    topPerformingCategory: string;
    recentUsage: UsageRecord[];
  } {
    const totalUsage = this.usageHistory.length;
    const successCount = this.usageHistory.filter(r => r.success).length;
    const successRate = totalUsage > 0 ? (successCount / totalUsage) * 100 : 0;
    
    const totalTime = this.usageHistory.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = totalUsage > 0 ? totalTime / totalUsage : 0;
    
    const uniqueTools = new Set(this.usageHistory.map(r => r.toolId));
    const activeTools = uniqueTools.size;
    
    const categoryMetrics = this.getCategoryMetrics();
    const topPerformingCategory = categoryMetrics.length > 0 ? categoryMetrics[0].category : 'None';
    
    const recentUsage = this.usageHistory
      .slice(-10)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      totalUsage,
      successRate,
      averageExecutionTime,
      activeTools,
      topPerformingCategory,
      recentUsage
    };
  }

  /**
   * Get trending tools
   */
  getTrendingTools(days: number = 7): ToolMetrics[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentUsage = this.usageHistory.filter(r => r.timestamp >= cutoffDate);
    const toolUsage = new Map<string, { count: number; toolName: string; category: string }>();
    
    recentUsage.forEach(record => {
      const existing = toolUsage.get(record.toolId);
      if (existing) {
        existing.count++;
      } else {
        toolUsage.set(record.toolId, {
          count: 1,
          toolName: record.toolName,
          category: record.category
        });
      }
    });
    
    return Array.from(toolUsage.entries())
      .map(([toolId, data]) => {
        const toolRecords = recentUsage.filter(r => r.toolId === toolId);
        const successCount = toolRecords.filter(r => r.success).length;
        const avgTime = toolRecords.reduce((sum, r) => sum + r.executionTime, 0) / toolRecords.length;
        
        return {
          toolId,
          toolName: data.toolName,
          totalUsage: data.count,
          successRate: (successCount / data.count) * 100,
          averageTime: avgTime,
          lastUsed: new Date(Math.max(...toolRecords.map(r => r.timestamp.getTime()))),
          popularityScore: data.count * (successCount / data.count),
          errorRate: ((data.count - successCount) / data.count) * 100
        };
      })
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }

  /**
   * Update metrics for a specific tool
   */
  private updateMetrics(toolId: string): void {
    const toolRecords = this.usageHistory.filter(r => r.toolId === toolId);
    if (toolRecords.length === 0) return;

    const successCount = toolRecords.filter(r => r.success).length;
    const totalTime = toolRecords.reduce((sum, r) => sum + r.executionTime, 0);
    const lastUsed = new Date(Math.max(...toolRecords.map(r => r.timestamp.getTime())));
    
    const metrics: ToolMetrics = {
      toolId,
      toolName: toolRecords[0].toolName,
      totalUsage: toolRecords.length,
      successRate: (successCount / toolRecords.length) * 100,
      averageTime: totalTime / toolRecords.length,
      lastUsed,
      popularityScore: toolRecords.length * (successCount / toolRecords.length),
      errorRate: ((toolRecords.length - successCount) / toolRecords.length) * 100
    };

    this.metricsCache.set(toolId, metrics);
  }

  /**
   * Refresh all metrics
   */
  private refreshMetrics(): void {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastCacheUpdate.getTime();
    
    // Refresh every 5 minutes
    if (timeSinceUpdate < 5 * 60 * 1000) return;
    
    const uniqueToolIds = new Set(this.usageHistory.map(r => r.toolId));
    uniqueToolIds.forEach(toolId => {
      this.updateMetrics(toolId);
    });
    
    this.lastCacheUpdate = now;
  }

  /**
   * Persist usage data to localStorage
   */
  private persistToStorage(): void {
    try {
      // Keep only last 1000 records to prevent storage bloat
      const recentRecords = this.usageHistory.slice(-1000);
      localStorage.setItem('ai_usage_history', JSON.stringify(recentRecords));
    } catch (error) {
      console.warn('Failed to persist usage data:', error);
    }
  }

  /**
   * Load usage data from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ai_usage_history');
      if (stored) {
        const records = JSON.parse(stored);
        this.usageHistory = records.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
        this.refreshMetrics();
      }
    } catch (error) {
      console.warn('Failed to load usage data:', error);
      this.usageHistory = [];
    }
  }

  /**
   * Clear all usage data
   */
  clearUsageData(): void {
    this.usageHistory = [];
    this.metricsCache.clear();
    localStorage.removeItem('ai_usage_history');
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(): string {
    return JSON.stringify({
      records: this.usageHistory,
      metrics: Array.from(this.metricsCache.entries()),
      exportDate: new Date().toISOString()
    }, null, 2);
  }
}

// Create singleton instance
export const aiUsageTracker = new AIUsageTracker();

// Load data on initialization
aiUsageTracker.loadFromStorage();

export default aiUsageTracker;
export type { UsageRecord, ToolMetrics, CategoryMetrics };
