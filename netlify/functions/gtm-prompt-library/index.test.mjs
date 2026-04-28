#!/usr/bin/env node

/**
 * GTM Prompt Library Analytics API Tests
 * Tests the Netlify function endpoints
 * Run with: node netlify/functions/gtm-prompt-library/index.test.mjs
 */

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Basic test implementation without external dependencies
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

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

// Import after setting environment variables
const { handler } = await import('./index.mjs');

// Test cases
async function testCORSPreflight() {
  const event = { httpMethod: 'OPTIONS' };
  const result = await handler(event, {});

  assert(result.statusCode === 200, 'CORS preflight handling');
  assert(result.headers['Access-Control-Allow-Origin'] === '*', 'CORS headers present');
}

async function testInvalidMethod() {
  const event = { httpMethod: 'GET', headers: {}, body: '{}' };
  const result = await handler(event, {});

  assert(result.statusCode === 405, 'Invalid HTTP method rejection');
}

async function testMissingAuth() {
  const event = {
    httpMethod: 'POST',
    headers: {},
    body: JSON.stringify({ action: 'dashboard' })
  };
  const result = await handler(event, {});

  assert(result.statusCode === 401, 'Missing authentication rejection');
}

// Run tests
async function runTests() {
  console.log('Running GTM Prompt Library Analytics API Tests...\n');

  await testCORSPreflight();
  await testInvalidMethod();
  await testMissingAuth();

  console.log(`\nResults: ${testResults.passed}/${testResults.total} tests passed`);

  if (testResults.failed === 0) {
    console.log('🎉 All basic tests passed!');
    console.log('Note: Full integration tests require Supabase connection and are tested in production.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check implementation.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});