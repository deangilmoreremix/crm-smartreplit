#!/usr/bin/env node

/**
 * SmartCRM API Health Test Suite
 * Tests all APIs, Supabase edge functions, and fallback mechanisms
 * Run with: node test-api-health.test.js
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartCRM-API-Test/1.0',
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

// Test runner
function runTest(name, testFn) {
  return new Promise(async (resolve) => {
    testResults.total++;
    console.log(`\n🧪 Running: ${name}`);

    try {
      const result = await testFn();
      if (result.passed) {
        testResults.passed++;
        console.log(`✅ PASSED: ${name}`);
        if (result.message) console.log(`   ${result.message}`);
      } else if (result.warning) {
        testResults.warnings++;
        console.log(`⚠️  WARNING: ${name}`);
        console.log(`   ${result.message}`);
      } else {
        testResults.failed++;
        console.log(`❌ FAILED: ${name}`);
        console.log(`   ${result.message}`);
      }
      testResults.tests.push({ name, ...result });
    } catch (error) {
      testResults.failed++;
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      testResults.tests.push({ name, passed: false, message: error.message });
    }
    resolve();
  });
}

// Test functions
async function testHealthEndpoint() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      return { passed: true, message: 'Health endpoint responding correctly' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Health check failed: ${error.message}` };
  }
}

async function testSupabaseConnection() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/supabase/test`);
    if (response.data.status === 'success') {
      return { passed: true, message: 'Supabase connection successful' };
    } else if (response.data.status === 'error' && response.data.message.includes('not configured')) {
      return { passed: false, message: 'Supabase credentials not configured' };
    } else {
      return { passed: false, message: `Supabase test failed: ${response.data.message}` };
    }
  } catch (error) {
    return { passed: false, message: `Supabase test error: ${error.message}` };
  }
}

async function testOpenAIStatus() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/status`);
    if (response.data.configured) {
      return { passed: true, message: `OpenAI configured with model: ${response.data.model}` };
    } else {
      return { warning: true, message: 'OpenAI not configured - using fallback mode' };
    }
  } catch (error) {
    return { passed: false, message: `OpenAI status check failed: ${error.message}` };
  }
}

async function testGoogleAIStatus() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/status`);
    if (response.data.googleai?.available) {
      return { passed: true, message: `Google AI available with model: ${response.data.googleai.model}` };
    } else {
      return { warning: true, message: 'Google AI not available - limited fallback' };
    }
  } catch (error) {
    return { passed: false, message: `Google AI status check failed: ${error.message}` };
  }
}

async function testSupabaseEdgeFunctions() {
  const functions = [
    'analyze-sentiment',
    'contacts',
    'deals',
    'draft-email-response',
    'generate-sales-pitch',
    'natural-language-query',
    'prioritize-tasks',
    'summarize-customer-notes'
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

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
        passed++;
        results.push(`${func}: ✅`);
      } else {
        failed++;
        results.push(`${func}: ❌ (${response.status})`);
      }
    } catch (error) {
      failed++;
      results.push(`${func}: ❌ (${error.message})`);
    }
  }

  if (failed === 0) {
    return { passed: true, message: `All ${passed} edge functions working` };
  } else {
    return { passed: false, message: `${failed}/${passed + failed} functions failed: ${results.join(', ')}` };
  }
}

async function testFallbackMechanisms() {
  try {
    // Test AI endpoint without API keys
    const response = await makeRequest(`${BASE_URL}/api/openai/smart-greeting`, {
      method: 'POST',
      body: {
        userMetrics: { totalDeals: 5, totalValue: 25000 },
        timeOfDay: 'morning',
        recentActivity: ['Created new deal', 'Updated contact']
      }
    });

    if (response.status === 200 && response.data.source === 'intelligent_fallback') {
      return { passed: true, message: 'Fallback mechanism working correctly' };
    } else if (response.status === 200) {
      return { passed: true, message: 'AI working with configured keys' };
    } else {
      return { passed: false, message: `Fallback test failed: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Fallback test error: ${error.message}` };
  }
}

async function testDatabaseEndpoints() {
  const endpoints = [
    { path: '/api/partners', method: 'GET', description: 'Partners list' },
    { path: '/api/white-label/tenants', method: 'GET', description: 'Tenants list' },
    { path: '/api/users', method: 'GET', description: 'Users list' }
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method
      });

      if (response.status === 200) {
        passed++;
        results.push(`${endpoint.description}: ✅`);
      } else {
        failed++;
        results.push(`${endpoint.description}: ❌ (${response.status})`);
      }
    } catch (error) {
      failed++;
      results.push(`${endpoint.description}: ❌ (${error.message})`);
    }
  }

  if (failed === 0) {
    return { passed: true, message: `All ${passed} database endpoints working` };
  } else {
    return { passed: false, message: `${failed}/${passed + failed} endpoints failed: ${results.join(', ')}` };
  }
}

async function testMessagingAPI() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/messaging/providers`);
    if (response.status === 200 && Array.isArray(response.data)) {
      return { passed: true, message: `${response.data.length} messaging providers available` };
    } else {
      return { passed: false, message: `Messaging API failed: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Messaging API error: ${error.message}` };
  }
}

async function testAuthentication() {
  try {
    // Test dev bypass in development
    if (process.env.NODE_ENV === 'development') {
      const response = await makeRequest(`${BASE_URL}/api/auth/dev-bypass`, {
        method: 'POST'
      });

      if (response.status === 200 && response.data.hasAccess) {
        return { passed: true, message: 'Dev authentication bypass working' };
      }
    }

    // Test user role endpoint
    const response = await makeRequest(`${BASE_URL}/api/auth/user-role`);
    if (response.status === 200) {
      return { passed: true, message: 'Authentication system responding' };
    } else {
      return { passed: false, message: `Auth check failed: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Authentication test error: ${error.message}` };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 SmartCRM API Health Test Suite');
  console.log('=====================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL || 'Not configured'}`);
  console.log('');

  // Run all tests
  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Supabase Connection', testSupabaseConnection);
  await runTest('OpenAI Status', testOpenAIStatus);
  await runTest('Google AI Status', testGoogleAIStatus);
  await runTest('Supabase Edge Functions', testSupabaseEdgeFunctions);
  await runTest('Fallback Mechanisms', testFallbackMechanisms);
  await runTest('Database Endpoints', testDatabaseEndpoints);
  await runTest('Messaging API', testMessagingAPI);
  await runTest('Authentication System', testAuthentication);

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log('\n🎉 All tests passed! SmartCRM is fully operational.');
  } else if (testResults.failed === 0) {
    console.log('\n⚠️  All critical tests passed, but some warnings to review.');
  } else {
    console.log('\n❌ Some tests failed. Check configuration and services.');
  }

  // Detailed results
  console.log('\n📋 Detailed Results:');
  testResults.tests.forEach(test => {
    const icon = test.passed ? '✅' : test.warning ? '⚠️' : '❌';
    console.log(`${icon} ${test.name}: ${test.message}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (testResults.failed > 0) {
    console.log('- Check API key configuration');
    console.log('- Verify Supabase connection');
    console.log('- Review edge function deployments');
  }
  if (testResults.warnings > 0) {
    console.log('- Consider configuring additional AI providers');
    console.log('- Review fallback mechanisms');
  }
  if (testResults.passed === testResults.total) {
    console.log('- All systems operational!');
    console.log('- Consider setting up monitoring for production');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export {
  runAllTests,
  testHealthEndpoint,
  testSupabaseConnection,
  testOpenAIStatus,
  testGoogleAIStatus,
  testSupabaseEdgeFunctions,
  testFallbackMechanisms,
  testDatabaseEndpoints,
  testMessagingAPI,
  testAuthentication
};