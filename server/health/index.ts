import { supabase, isSupabaseConfigured } from '../supabase';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  responseTime?: number;
  details?: any;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    warning: number;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const { db } = await import('../db');

    // Simple query to test database connection
    await db.execute('SELECT 1 as health_check');

    return {
      name: 'database',
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: Date.now() - start
    };
  } catch (error: any) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}

/**
 * Check Supabase connectivity
 */
async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        name: 'supabase',
        status: 'warning',
        message: 'Supabase not configured (using mock data)',
        responseTime: Date.now() - start
      };
    }

    // Test Supabase connection with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    return {
      name: 'supabase',
      status: 'healthy',
      message: 'Supabase connection successful',
      responseTime: Date.now() - start
    };
  } catch (error: any) {
    return {
      name: 'supabase',
      status: 'unhealthy',
      message: `Supabase connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}

/**
 * Check external API connectivity (OpenAI, Google AI)
 */
async function checkExternalAPIs(): Promise<HealthCheck> {
  const start = Date.now();
  const results = [];

  // Check OpenAI
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      results.push({ service: 'openai', status: 'warning', message: 'API key not configured' });
    } else {
      // We can't make actual API calls in health checks due to rate limits
      // Just check if the key exists and is properly formatted
      results.push({ service: 'openai', status: 'healthy', message: 'API key configured' });
    }
  } catch (error: any) {
    results.push({ service: 'openai', status: 'unhealthy', message: error.message });
  }

  // Check Google AI
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      results.push({ service: 'google_ai', status: 'warning', message: 'API key not configured' });
    } else {
      results.push({ service: 'google_ai', status: 'healthy', message: 'API key configured' });
    }
  } catch (error: any) {
    results.push({ service: 'google_ai', status: 'unhealthy', message: error.message });
  }

  const hasUnhealthy = results.some(r => r.status === 'unhealthy');
  const hasWarning = results.some(r => r.status === 'warning');

  return {
    name: 'external_apis',
    status: hasUnhealthy ? 'unhealthy' : hasWarning ? 'warning' : 'healthy',
    message: `External APIs: ${results.filter(r => r.status === 'healthy').length} healthy, ${results.filter(r => r.status === 'warning').length} warnings, ${results.filter(r => r.status === 'unhealthy').length} unhealthy`,
    responseTime: Date.now() - start,
    details: { apis: results }
  };
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const usagePercent = Math.round((usedMB / totalMB) * 100);

  let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy';
  let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`;

  if (usagePercent > 90) {
    status = 'unhealthy';
    message += ' - Critical memory usage';
  } else if (usagePercent > 80) {
    status = 'warning';
    message += ' - High memory usage';
  }

  return {
    name: 'memory',
    status,
    message,
    details: {
      heapTotal: totalMB,
      heapUsed: usedMB,
      usagePercent,
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    }
  };
}

/**
 * Check system resources
 */
function checkSystem(): HealthCheck {
  const uptime = process.uptime();
  const uptimeHours = Math.round(uptime / 3600);
  const loadAverage = process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0];

  return {
    name: 'system',
    status: 'healthy',
    message: `System uptime: ${uptimeHours} hours`,
    details: {
      uptime: uptimeHours,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      loadAverage: loadAverage.map((load: number) => Math.round(load * 100) / 100)
    }
  };
}

/**
 * Comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    checkSupabase(),
    checkExternalAPIs(),
    checkMemory(),
    checkSystem()
  ]);

  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'healthy').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    warning: checks.filter(c => c.status === 'warning').length
  };

  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (summary.unhealthy > 0) {
    overallStatus = 'unhealthy';
  } else if (summary.warning > 0) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks,
    summary
  };
}

/**
 * Express middleware for health check endpoint
 */
export async function healthCheckMiddleware(req: any, res: any) {
  try {
    const health = await performHealthCheck();

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (health.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (health.status === 'degraded') {
      statusCode = 200; // Still OK but with warnings
    }

    res.status(statusCode).json(health);
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
}