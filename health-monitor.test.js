#!/usr/bin/env node

/**
 * SmartCRM Health Monitor
 * Continuous monitoring and alerting for production systems
 * Run with: node health-monitor.test.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL) || 300000; // 5 minutes default
const LOG_FILE = 'health-monitor.log';

// Health status
let healthStatus = {
  overall: 'unknown',
  lastCheck: null,
  services: {},
  alerts: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartCRM-Health-Monitor/1.0',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;

  console.log(logEntry.trim());

  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Alert function
function sendAlert(subject, message) {
  log(`ALERT: ${subject} - ${message}`, 'ALERT');

  healthStatus.alerts.push({
    timestamp: new Date().toISOString(),
    subject,
    message,
    resolved: false
  });

  // Keep only last 100 alerts
  if (healthStatus.alerts.length > 100) {
    healthStatus.alerts = healthStatus.alerts.slice(-100);
  }

  // Here you could integrate with email services, Slack, etc.
  if (ALERT_EMAIL) {
    log(`Would send email alert to: ${ALERT_EMAIL}`);
  }
}

// Health check functions
async function checkHealthEndpoint() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    const isHealthy = response.status === 200 && response.data.status === 'ok';

    healthStatus.services.health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - new Date().getTime(),
      details: response.data
    };

    if (!isHealthy) {
      sendAlert('Health Endpoint Failed', `Status: ${response.status}`);
    }

    return isHealthy;
  } catch (error) {
    healthStatus.services.health = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    sendAlert('Health Endpoint Error', error.message);
    return false;
  }
}

async function checkSupabaseConnection() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/supabase/test`);
    const isHealthy = response.data.status === 'success';

    healthStatus.services.supabase = {
      status: isHealthy ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      details: response.data
    };

    if (!isHealthy && response.data.status !== 'error') {
      sendAlert('Supabase Connection Issue', response.data.message);
    }

    return isHealthy;
  } catch (error) {
    healthStatus.services.supabase = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    sendAlert('Supabase Connection Error', error.message);
    return false;
  }
}

async function checkOpenAIStatus() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/status`);
    const isHealthy = response.data.configured;

    healthStatus.services.openai = {
      status: isHealthy ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      model: response.data.model,
      details: response.data
    };

    return isHealthy;
  } catch (error) {
    healthStatus.services.openai = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
}

async function checkGoogleAIStatus() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/status`);
    const isHealthy = response.data.googleai?.available;

    healthStatus.services.googleai = {
      status: isHealthy ? 'healthy' : 'degraded',
      lastCheck: new Date().toISOString(),
      model: response.data.googleai?.model,
      details: response.data.googleai
    };

    return isHealthy;
  } catch (error) {
    healthStatus.services.googleai = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    return false;
  }
}

async function checkEdgeFunctions() {
  const functions = [
    'analyze-sentiment',
    'contacts',
    'deals',
    'draft-email-response',
    'generate-sales-pitch'
  ];

  let healthy = 0;
  let unhealthy = 0;

  for (const func of functions) {
    try {
      const response = await makeRequest(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: { test: true }
      });

      if (response.status === 200) {
        healthy++;
      } else {
        unhealthy++;
        sendAlert(`Edge Function ${func} Failed`, `Status: ${response.status}`);
      }
    } catch (error) {
      unhealthy++;
      sendAlert(`Edge Function ${func} Error`, error.message);
    }
  }

  healthStatus.services.edgeFunctions = {
    status: unhealthy === 0 ? 'healthy' : 'degraded',
    lastCheck: new Date().toISOString(),
    healthy,
    unhealthy,
    total: functions.length
  };

  return unhealthy === 0;
}

async function checkDatabaseEndpoints() {
  const endpoints = [
    { path: '/api/partners', description: 'Partners API' },
    { path: '/api/white-label/tenants', description: 'Tenants API' },
    { path: '/api/users', description: 'Users API' }
  ];

  let healthy = 0;
  let unhealthy = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);

      if (response.status === 200) {
        healthy++;
      } else {
        unhealthy++;
        sendAlert(`${endpoint.description} Failed`, `Status: ${response.status}`);
      }
    } catch (error) {
      unhealthy++;
      sendAlert(`${endpoint.description} Error`, error.message);
    }
  }

  healthStatus.services.database = {
    status: unhealthy === 0 ? 'healthy' : 'degraded',
    lastCheck: new Date().toISOString(),
    healthy,
    unhealthy,
    total: endpoints.length
  };

  return unhealthy === 0;
}

async function checkFallbackMechanisms() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/smart-greeting`, {
      method: 'POST',
      body: {
        userMetrics: { totalDeals: 5, totalValue: 25000 },
        timeOfDay: 'morning',
        recentActivity: ['Test activity']
      }
    });

    const isHealthy = response.status === 200 &&
      (response.data.source === 'intelligent_fallback' || response.data.source === 'gpt-4o-mini');

    healthStatus.services.fallbacks = {
      status: isHealthy ? 'healthy' : 'error',
      lastCheck: new Date().toISOString(),
      fallbackActive: response.data.source === 'intelligent_fallback'
    };

    if (!isHealthy) {
      sendAlert('Fallback Mechanisms Failed', `Unexpected response: ${response.status}`);
    }

    return isHealthy;
  } catch (error) {
    healthStatus.services.fallbacks = {
      status: 'error',
      lastCheck: new Date().toISOString(),
      error: error.message
    };
    sendAlert('Fallback Mechanisms Error', error.message);
    return false;
  }
}

// Comprehensive health check
async function performHealthCheck() {
  log('Starting comprehensive health check...');

  const checks = await Promise.allSettled([
    checkHealthEndpoint(),
    checkSupabaseConnection(),
    checkOpenAIStatus(),
    checkGoogleAIStatus(),
    checkEdgeFunctions(),
    checkDatabaseEndpoints(),
    checkFallbackMechanisms()
  ]);

  const results = checks.map((result, index) => ({
    check: ['Health Endpoint', 'Supabase', 'OpenAI', 'Google AI', 'Edge Functions', 'Database', 'Fallbacks'][index],
    success: result.status === 'fulfilled' ? result.value : false,
    error: result.status === 'rejected' ? result.reason.message : null
  }));

  // Calculate overall health
  const successfulChecks = results.filter(r => r.success).length;
  const totalChecks = results.length;

  healthStatus.overall = successfulChecks === totalChecks ? 'healthy' :
                         successfulChecks >= totalChecks * 0.7 ? 'degraded' : 'unhealthy';
  healthStatus.lastCheck = new Date().toISOString();

  log(`Health check completed: ${successfulChecks}/${totalChecks} checks passed`);

  // Log detailed results
  results.forEach(result => {
    if (result.success) {
      log(`✅ ${result.check}: OK`);
    } else {
      log(`❌ ${result.check}: FAILED${result.error ? ` - ${result.error}` : ''}`, 'ERROR');
    }
  });

  // Send critical alerts
  if (healthStatus.overall === 'unhealthy') {
    sendAlert('CRITICAL: System Unhealthy', `${successfulChecks}/${totalChecks} health checks failed`);
  } else if (healthStatus.overall === 'degraded') {
    sendAlert('WARNING: System Degraded', `${successfulChecks}/${totalChecks} health checks passed`);
  }

  return healthStatus;
}

// Status endpoint for external monitoring
function startHealthServer(port = 8080) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthStatus, null, 2));
    } else if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        overall: healthStatus.overall,
        lastCheck: healthStatus.lastCheck,
        services: Object.keys(healthStatus.services).reduce((acc, key) => {
          acc[key] = healthStatus.services[key].status;
          return acc;
        }, {})
      }, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    log(`Health monitor server running on port ${port}`);
    log(`Health endpoint: http://localhost:${port}/health`);
    log(`Status endpoint: http://localhost:${port}/status`);
  });

  return server;
}

// Main monitoring function
async function startMonitoring() {
  log('🚀 SmartCRM Health Monitor Started');
  log(`Monitoring interval: ${MONITOR_INTERVAL / 1000} seconds`);
  log(`Alert email: ${ALERT_EMAIL || 'Not configured'}`);
  log('');

  // Initial health check
  await performHealthCheck();

  // Start periodic monitoring
  setInterval(async () => {
    await performHealthCheck();
  }, MONITOR_INTERVAL);

  // Start health server if requested
  if (process.env.HEALTH_SERVER_PORT) {
    startHealthServer(parseInt(process.env.HEALTH_SERVER_PORT));
  }
}

// CLI interface
function showUsage() {
  console.log('SmartCRM Health Monitor');
  console.log('Usage:');
  console.log('  node health-monitor.test.js monitor    # Start continuous monitoring');
  console.log('  node health-monitor.test.js check      # Run single health check');
  console.log('  node health-monitor.test.js server     # Start health status server only');
  console.log('');
  console.log('Environment Variables:');
  console.log('  BASE_URL              # SmartCRM base URL (default: http://localhost:5000)');
  console.log('  SUPABASE_URL          # Supabase project URL');
  console.log('  SUPABASE_ANON_KEY     # Supabase anonymous key');
  console.log('  ALERT_EMAIL           # Email for alerts');
  console.log('  MONITOR_INTERVAL      # Monitoring interval in ms (default: 300000)');
  console.log('  HEALTH_SERVER_PORT    # Port for health status server');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'monitor':
      startMonitoring();
      break;
    case 'check':
      performHealthCheck().then(() => {
        console.log('\nHealth check completed.');
        process.exit(healthStatus.overall === 'healthy' ? 0 : 1);
      });
      break;
    case 'server':
      startHealthServer();
      break;
    default:
      showUsage();
      process.exit(1);
  }
}

export {
  performHealthCheck,
  startMonitoring,
  startHealthServer,
  healthStatus
};