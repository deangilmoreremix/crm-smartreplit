#!/usr/bin/env node

/**
 * SmartCRM Demo Test
 * Demonstrates the testing capabilities and provides usage examples
 * Run with: node demo-test.test.js
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Demo test results
let demoResults = {
  tests: [],
  passed: 0,
  failed: 0
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartCRM-Demo-Test/1.0',
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Demo test functions
async function demoHealthCheck() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);
    const passed = response.status === 200 && response.data.status === 'ok';
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data)}`);
    console.log(`   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    demoResults.tests.push({
      name: 'Health Check',
      passed,
      message: passed ? 'Health endpoint responding correctly' : 'Health check failed'
    });

    if (passed) demoResults.passed++;
    else demoResults.failed++;

    return passed;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAILED');

    demoResults.tests.push({
      name: 'Health Check',
      passed: false,
      message: `Health check error: ${error.message}`
    });
    demoResults.failed++;
    return false;
  }
}

async function demoSupabaseTest() {
  console.log('\n🗄️  Testing Supabase Connection...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/supabase/test`);
    const passed = response.data.status === 'success';
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Message: ${response.data.message || 'N/A'}`);
    console.log(`   Result: ${passed ? '✅ PASSED' : '⚠️  DEGRADED'}`);

    demoResults.tests.push({
      name: 'Supabase Connection',
      passed,
      message: passed ? 'Supabase connection successful' : 'Supabase connection issue'
    });

    if (passed) demoResults.passed++;
    else demoResults.failed++;

    return passed;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAILED');

    demoResults.tests.push({
      name: 'Supabase Connection',
      passed: false,
      message: `Supabase test error: ${error.message}`
    });
    demoResults.failed++;
    return false;
  }
}

async function demoOpenAIStatus() {
  console.log('\n🤖 Testing OpenAI Status...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/status`);
    const configured = response.data.configured;
    console.log(`   Configured: ${configured}`);
    console.log(`   Model: ${response.data.model || 'none'}`);
    console.log(`   Result: ${configured ? '✅ PASSED' : '⚠️  WARNING'}`);

    demoResults.tests.push({
      name: 'OpenAI Status',
      passed: configured,
      message: configured ? `OpenAI configured with model: ${response.data.model}` : 'OpenAI not configured'
    });

    if (configured) demoResults.passed++;
    else demoResults.failed++;

    return configured;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAILED');

    demoResults.tests.push({
      name: 'OpenAI Status',
      passed: false,
      message: `OpenAI status error: ${error.message}`
    });
    demoResults.failed++;
    return false;
  }
}

async function demoFallbackMechanism() {
  console.log('\n🔄 Testing Fallback Mechanisms...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/smart-greeting`, {
      method: 'POST',
      body: {
        userMetrics: { totalDeals: 5, totalValue: 25000 },
        timeOfDay: 'morning',
        recentActivity: ['Test activity']
      }
    });

    const hasFallback = response.data.source === 'intelligent_fallback';
    console.log(`   Response Source: ${response.data.source || 'unknown'}`);
    console.log(`   Fallback Active: ${hasFallback}`);
    console.log(`   Result: ${response.status === 200 ? '✅ PASSED' : '❌ FAILED'}`);

    demoResults.tests.push({
      name: 'Fallback Mechanism',
      passed: response.status === 200,
      message: hasFallback ? 'Intelligent fallback working' : 'AI service responding'
    });

    if (response.status === 200) demoResults.passed++;
    else demoResults.failed++;

    return response.status === 200;
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log('   Result: ❌ FAILED');

    demoResults.tests.push({
      name: 'Fallback Mechanism',
      passed: false,
      message: `Fallback test error: ${error.message}`
    });
    demoResults.failed++;
    return false;
  }
}

// Main demo function
async function runDemo() {
  console.log('🚀 SmartCRM Testing Suite Demo');
  console.log('===============================');
  console.log('');
  console.log('This demo showcases the testing capabilities of SmartCRM.');
  console.log('It tests key endpoints and demonstrates fallback mechanisms.');
  console.log('');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');

  // Run demo tests
  await demoHealthCheck();
  await demoSupabaseTest();
  await demoOpenAIStatus();
  await demoFallbackMechanism();

  // Show results
  console.log('\n📊 Demo Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${demoResults.tests.length}`);
  console.log(`✅ Passed: ${demoResults.passed}`);
  console.log(`❌ Failed: ${demoResults.failed}`);

  const successRate = ((demoResults.passed / demoResults.tests.length) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  console.log('\n📋 Detailed Results:');
  demoResults.tests.forEach((test, index) => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`   ${index + 1}. ${icon} ${test.name}: ${test.message}`);
  });

  console.log('\n💡 Next Steps:');
  console.log('   1. Run comprehensive tests: node comprehensive-test-runner.test.js');
  console.log('   2. Test specific components: node test-api-health.test.js');
  console.log('   3. Monitor health: node health-monitor.test.js monitor');
  console.log('   4. Test edge functions: node supabase-edge-functions.test.js');
  console.log('   5. Test fallbacks: node fallback-mechanisms.test.js');

  console.log('\n🔧 Environment Setup:');
  console.log('   Set BASE_URL for your SmartCRM instance');
  console.log('   Configure SUPABASE_URL and SUPABASE_ANON_KEY');
  console.log('   Add OPENAI_API_KEY and GOOGLE_AI_API_KEY for full AI testing');

  console.log('\n📚 For more information, see the comments in each test file.');

  // Exit with appropriate code
  process.exit(demoResults.failed > 0 ? 1 : 0);
}

// Show usage if help requested
function showUsage() {
  console.log('SmartCRM Demo Test');
  console.log('===================');
  console.log('');
  console.log('Usage:');
  console.log('  node demo-test.test.js        # Run demo tests');
  console.log('  node demo-test.test.js --help # Show this help');
  console.log('');
  console.log('Environment Variables:');
  console.log('  BASE_URL=http://localhost:5000  # SmartCRM base URL');
  console.log('');
  console.log('Demo Tests:');
  console.log('  - Health endpoint check');
  console.log('  - Supabase connection test');
  console.log('  - OpenAI status verification');
  console.log('  - Fallback mechanism demonstration');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];

  if (arg === '--help' || arg === '-h') {
    showUsage();
  } else {
    runDemo().catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
  }
}

export {
  runDemo,
  demoHealthCheck,
  demoSupabaseTest,
  demoOpenAIStatus,
  demoFallbackMechanism
};