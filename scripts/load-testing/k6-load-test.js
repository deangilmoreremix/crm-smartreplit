/**
 * SmartCRM Load Testing Suite
 * Tests system performance under various load conditions
 * 
 * Run with: k6 run scripts/load-testing/k6-load-test.js
 * 
 * Requirements:
 * - Install k6: https://k6.io/docs/getting-started/installation/
 * - Set environment variables: BASE_URL, TEST_EMAIL, TEST_PASSWORD
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'Test123!';

// Load test stages
export const options = {
  stages: [
    // Warm-up: Ramp up to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    
    // Steady state: Maintain 100 users for 5 minutes
    { duration: '5m', target: 100 },
    
    // Peak load: Ramp up to 500 users over 3 minutes
    { duration: '3m', target: 500 },
    
    // Stress test: Maintain 500 users for 5 minutes
    { duration: '5m', target: 500 },
    
    // Spike test: Sudden spike to 1000 users for 2 minutes
    { duration: '2m', target: 1000 },
    
    // Recovery: Ramp down to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    
    // Cool down: Ramp down to 0 users over 1 minute
    { duration: '1m', target: 0 },
  ],
  
  thresholds: {
    // 95% of requests should complete within 500ms
    'http_req_duration': ['p(95)<500'],
    
    // Error rate should be less than 1%
    'errors': ['rate<0.01'],
    
    // 99% of requests should succeed
    'http_req_failed': ['rate<0.01'],
    
    // API response time should be under 200ms for 90% of requests
    'api_response_time': ['p(90)<200', 'p(95)<500', 'p(99)<1000'],
  },
};

// Test data
const testContacts = [
  { name: 'John Doe', email: 'john@example.com', company: 'Acme Corp' },
  { name: 'Jane Smith', email: 'jane@example.com', company: 'Tech Inc' },
  { name: 'Bob Johnson', email: 'bob@example.com', company: 'StartupXYZ' },
];

const testDeals = [
  { title: 'Enterprise Deal', value: 50000, stage: 'qualification' },
  { title: 'SMB Deal', value: 10000, stage: 'proposal' },
  { title: 'Startup Deal', value: 5000, stage: 'negotiation' },
];

// Setup function - runs once per VU
export function setup() {
  // Authenticate and get session
  const loginRes = http.post(`${BASE_URL}/api/auth/signin`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  return {
    sessionCookie: loginRes.cookies['connect.sid'] || '',
  };
}

// Main test function
export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `connect.sid=${data.sessionCookie}`,
    },
  };

  // Test 1: Health Check
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`, params);
    
    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
      'health check returns status': (r) => r.json('status') === 'ok',
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  sleep(1);

  // Test 2: List Contacts
  group('List Contacts', () => {
    const res = http.get(`${BASE_URL}/api/contacts?page=1&limit=50`, params);
    
    const success = check(res, {
      'list contacts status is 200': (r) => r.status === 200,
      'list contacts response time < 200ms': (r) => r.timings.duration < 200,
      'list contacts returns array': (r) => Array.isArray(r.json('contacts')),
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  sleep(1);

  // Test 3: Create Contact
  group('Create Contact', () => {
    const contact = testContacts[Math.floor(Math.random() * testContacts.length)];
    const uniqueEmail = `${Date.now()}-${Math.random()}@example.com`;
    
    const res = http.post(
      `${BASE_URL}/api/contacts`,
      JSON.stringify({ ...contact, email: uniqueEmail }),
      params
    );
    
    const success = check(res, {
      'create contact status is 201': (r) => r.status === 201,
      'create contact response time < 300ms': (r) => r.timings.duration < 300,
      'create contact returns id': (r) => r.json('id') !== undefined,
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  sleep(1);

  // Test 4: List Deals
  group('List Deals', () => {
    const res = http.get(`${BASE_URL}/api/deals?page=1&limit=50`, params);
    
    const success = check(res, {
      'list deals status is 200': (r) => r.status === 200,
      'list deals response time < 200ms': (r) => r.timings.duration < 200,
      'list deals returns array': (r) => Array.isArray(r.json('deals')),
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  sleep(1);

  // Test 5: Dashboard Data
  group('Dashboard Data', () => {
    const res = http.get(`${BASE_URL}/api/dashboard/stats`, params);
    
    const success = check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(!success);
    
    if (success) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
  });

  sleep(2);

  // Test 6: AI Features (if enabled)
  if (Math.random() < 0.1) { // 10% of users test AI features
    group('AI Chat', () => {
      const res = http.post(
        `${BASE_URL}/api/ai/chat`,
        JSON.stringify({
          message: 'Summarize my deals',
          context: { page: 'dashboard' },
        }),
        params
      );
      
      const success = check(res, {
        'ai chat status is 200 or 429': (r) => r.status === 200 || r.status === 429,
        'ai chat response time < 2000ms': (r) => r.timings.duration < 2000,
      });

      apiResponseTime.add(res.timings.duration);
      errorRate.add(!success);
      
      if (success) {
        successfulRequests.add(1);
      } else {
        failedRequests.add(1);
      }
    });

    sleep(3);
  }

  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}

// Teardown function - runs once after all VUs complete
export function teardown(data) {
  // Logout
  http.post(`${BASE_URL}/api/auth/signout`, null, {
    headers: {
      'Cookie': `connect.sid=${data.sessionCookie}`,
    },
  });
}

// Handle summary for custom reporting
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': htmlReport(data),
  };
}

// Text summary helper
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}================\n\n`;
  
  // Test duration
  const duration = data.state.testRunDurationMs / 1000;
  summary += `${indent}Duration: ${duration.toFixed(2)}s\n`;
  
  // VUs
  summary += `${indent}VUs: ${data.metrics.vus.values.max}\n`;
  
  // Requests
  const requests = data.metrics.http_reqs.values.count;
  const rps = (requests / duration).toFixed(2);
  summary += `${indent}Total Requests: ${requests} (${rps} req/s)\n`;
  
  // Success rate
  const failed = data.metrics.http_req_failed.values.rate * 100;
  const success = 100 - failed;
  summary += `${indent}Success Rate: ${success.toFixed(2)}%\n`;
  
  // Response times
  summary += `${indent}\nResponse Times:\n`;
  summary += `${indent}  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `${indent}  p90: ${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  
  // Thresholds
  summary += `${indent}\nThresholds:\n`;
  for (const [name, threshold] of Object.entries(data.thresholds)) {
    const passed = threshold.ok ? '✓' : '✗';
    summary += `${indent}  ${passed} ${name}\n`;
  }
  
  return summary;
}

// HTML report helper
function htmlReport(data) {
  const duration = (data.state.testRunDurationMs / 1000).toFixed(2);
  const requests = data.metrics.http_reqs.values.count;
  const rps = (requests / duration).toFixed(2);
  const failed = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
  const success = (100 - failed).toFixed(2);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>SmartCRM Load Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .metric { display: inline-block; margin: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; min-width: 200px; }
    .metric-label { font-size: 14px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 32px; font-weight: bold; color: #007bff; margin-top: 10px; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .danger { color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    .threshold-pass { color: #28a745; font-weight: bold; }
    .threshold-fail { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SmartCRM Load Test Results</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    
    <div style="margin: 30px 0;">
      <div class="metric">
        <div class="metric-label">Duration</div>
        <div class="metric-value">${duration}s</div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Total Requests</div>
        <div class="metric-value">${requests}</div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Requests/sec</div>
        <div class="metric-value">${rps}</div>
      </div>
      
      <div class="metric">
        <div class="metric-label">Success Rate</div>
        <div class="metric-value ${success >= 99 ? 'success' : success >= 95 ? 'warning' : 'danger'}">${success}%</div>
      </div>
    </div>
    
    <h2>Response Times</h2>
    <table>
      <tr>
        <th>Percentile</th>
        <th>Response Time</th>
      </tr>
      <tr>
        <td>p50 (median)</td>
        <td>${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms</td>
      </tr>
      <tr>
        <td>p90</td>
        <td>${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms</td>
      </tr>
      <tr>
        <td>p95</td>
        <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
      </tr>
      <tr>
        <td>p99</td>
        <td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td>
      </tr>
    </table>
    
    <h2>Thresholds</h2>
    <table>
      <tr>
        <th>Threshold</th>
        <th>Status</th>
      </tr>
      ${Object.entries(data.thresholds).map(([name, threshold]) => `
        <tr>
          <td>${name}</td>
          <td class="${threshold.ok ? 'threshold-pass' : 'threshold-fail'}">
            ${threshold.ok ? '✓ PASS' : '✗ FAIL'}
          </td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>
  `;
}
