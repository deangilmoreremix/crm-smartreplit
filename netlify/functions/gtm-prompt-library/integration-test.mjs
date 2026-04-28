#!/usr/bin/env node

/**
 * GTM Prompt Library Analytics API - Integration Tests
 * Tests the Netlify function endpoints with real Supabase integration
 * Run with: node netlify/functions/gtm-prompt-library/integration-test.mjs
 */

import https from 'https';

// Configuration
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL || 'http://localhost:5000/.netlify/functions/gtm-prompt-library';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test user credentials (replace with actual test user)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  authToken: null
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Authenticate and get token
async function authenticate() {
  console.log('🔐 Authenticating with Supabase...');

  try {
    const response = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    }, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.statusCode === 200 && response.body?.access_token) {
      testResults.authToken = response.body.access_token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed:', response.body?.error || response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

// Test helper
function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${message}`);
  }
}

// Test API endpoints
async function testDashboardEndpoint() {
  if (!testResults.authToken) return;

  console.log('\n📊 Testing dashboard endpoint...');

  try {
    const response = await makeRequest(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testResults.authToken}`
      }
    }, {
      action: 'dashboard'
    });

    assert(response.statusCode === 200, 'Dashboard endpoint returns 200');
    assert(response.body?.dashboard, 'Dashboard response contains dashboard data');
    assert(typeof response.body.dashboard.overview === 'object', 'Dashboard contains overview metrics');

  } catch (error) {
    console.log('❌ Dashboard test error:', error.message);
    testResults.failed++;
    testResults.total++;
  }
}

async function testPerformanceEndpoint() {
  if (!testResults.authToken) return;

  console.log('\n📈 Testing performance endpoint...');

  try {
    const response = await makeRequest(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testResults.authToken}`
      }
    }, {
      action: 'performance',
      timeRange: '7d'
    });

    assert(response.statusCode === 200, 'Performance endpoint returns 200');
    assert(response.body?.performance, 'Performance response contains performance data');
    assert(response.body.performance.timeRange === '7d', 'Performance respects timeRange parameter');

  } catch (error) {
    console.log('❌ Performance test error:', error.message);
    testResults.failed++;
    testResults.total++;
  }
}

async function testRevenueEndpoint() {
  if (!testResults.authToken) return;

  console.log('\n💰 Testing revenue endpoint...');

  try {
    const response = await makeRequest(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testResults.authToken}`
      }
    }, {
      action: 'revenue',
      timeRange: '30d'
    });

    assert(response.statusCode === 200, 'Revenue endpoint returns 200');
    assert(response.body?.revenue, 'Revenue response contains revenue data');
    assert(typeof response.body.revenue.summary === 'object', 'Revenue contains summary metrics');

  } catch (error) {
    console.log('❌ Revenue test error:', error.message);
    testResults.failed++;
    testResults.total++;
  }
}

async function testABTestsEndpoints() {
  if (!testResults.authToken) return;

  console.log('\n🆚 Testing A/B tests endpoints...');

  // Test get A/B tests
  try {
    const response = await makeRequest(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testResults.authToken}`
      }
    }, {
      action: 'get_ab_tests'
    });

    assert(response.statusCode === 200, 'Get A/B tests endpoint returns 200');
    assert(Array.isArray(response.body?.ab_tests), 'Get A/B tests returns array');

  } catch (error) {
    console.log('❌ Get A/B tests error:', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test create A/B test (optional - requires test data)
  console.log('   (Create A/B test test skipped - requires test prompt data)');
}

async function testErrorHandling() {
  console.log('\n🚨 Testing error handling...');

  // Test missing auth
  try {
    const response = await makeRequest(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      action: 'dashboard'
    });

    assert(response.statusCode === 401, 'Missing auth returns 401');
  } catch (error) {
    console.log('❌ Missing auth test error:', error.message);
    testResults.failed++;
    testResults.total++;
  }

  // Test invalid action
  if (testResults.authToken) {
    try {
      const response = await makeRequest(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testResults.authToken}`
        }
      }, {
        action: 'invalid_action'
      });

      assert(response.statusCode === 400, 'Invalid action returns 400');
    } catch (error) {
      console.log('❌ Invalid action test error:', error.message);
      testResults.failed++;
      testResults.total++;
    }
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting GTM Prompt Library Analytics API Integration Tests\n');
  console.log('Configuration:');
  console.log(`  Function URL: ${NETLIFY_FUNCTION_URL}`);
  console.log(`  Supabase URL: ${SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`  Test User: ${TEST_EMAIL}\n`);

  // Check configuration
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication. Check test user credentials.');
    process.exit(1);
  }

  // Run endpoint tests
  await testDashboardEndpoint();
  await testPerformanceEndpoint();
  await testRevenueEndpoint();
  await testABTestsEndpoints();
  await testErrorHandling();

  // Summary
  console.log('\n📋 Test Results Summary:');
  console.log(`   Total: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All integration tests passed!');
    console.log('The GTM Prompt Library Analytics API is ready for production use.');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed.`);
    console.log('Check the implementation and test configuration.');
  }

  console.log('\n💡 Note: Some tests may fail if the database has no test data.');
  console.log('      The API structure and authentication are validated.');
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});