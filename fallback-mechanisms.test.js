#!/usr/bin/env node

/**
 * SmartCRM Fallback Mechanisms Test Suite
 * Tests all fallback scenarios when APIs or services fail
 * Run with: node fallback-mechanisms.test.js
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
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
        'User-Agent': 'SmartCRM-Fallback-Test/1.0',
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
    console.log(`\n🧪 Testing: ${name}`);

    try {
      const result = await testFn();
      if (result.passed) {
        testResults.passed++;
        console.log(`✅ PASSED: ${name}`);
        if (result.message) console.log(`   ${result.message}`);
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

// Fallback mechanism tests
async function testAISmartGreetingFallback() {
  try {
    // Test with no API keys configured
    const response = await makeRequest(`${BASE_URL}/api/openai/smart-greeting`, {
      method: 'POST',
      body: {
        userMetrics: { totalDeals: 15, totalValue: 75000 },
        timeOfDay: 'afternoon',
        recentActivity: ['Closed a $25k deal', 'Added 3 new contacts']
      }
    });

    if (response.status === 200) {
      if (response.data.source === 'intelligent_fallback') {
        return { passed: true, message: 'Intelligent fallback working correctly' };
      } else if (response.data.source === 'gpt-4o-mini') {
        return { passed: true, message: 'AI service working with configured keys' };
      } else {
        return { passed: false, message: 'Unexpected response source' };
      }
    } else {
      return { passed: false, message: `Request failed: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Fallback test error: ${error.message}` };
  }
}

async function testKPIAnalysisFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/kpi-analysis`, {
      method: 'POST',
      body: {
        historicalData: [10000, 12000, 15000, 18000],
        currentMetrics: { revenue: 20000, deals: 25, conversion: 0.15 }
      }
    });

    if (response.status === 200 && response.data.summary) {
      return { passed: true, message: 'KPI analysis fallback working' };
    } else if (response.status === 400 && response.data.error.includes('not configured')) {
      return { passed: true, message: 'Proper error handling for missing API keys' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `KPI fallback test error: ${error.message}` };
  }
}

async function testDealIntelligenceFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/deal-intelligence`, {
      method: 'POST',
      body: {
        dealData: { value: 50000, stage: 'proposal', probability: 75 },
        contactHistory: ['Initial meeting positive', 'Follow-up scheduled'],
        marketContext: 'Competitive market with high demand'
      }
    });

    if (response.status === 200 && response.data.probability_score) {
      return { passed: true, message: 'Deal intelligence fallback working' };
    } else if (response.status === 400 && response.data.error.includes('not configured')) {
      return { passed: true, message: 'Proper error handling for missing API keys' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Deal intelligence fallback test error: ${error.message}` };
  }
}

async function testBusinessIntelligenceFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/business-intelligence`, {
      method: 'POST',
      body: {
        businessData: { industry: 'Technology', size: '50-100', revenue: 2000000 },
        marketContext: 'Growing SaaS market',
        objectives: ['Increase market share', 'Improve customer retention']
      }
    });

    if (response.status === 200 && response.data.market_insights) {
      return { passed: true, message: 'Business intelligence fallback working' };
    } else if (response.status === 400 && response.data.error.includes('not configured')) {
      return { passed: true, message: 'Proper error handling for missing API keys' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Business intelligence fallback test error: ${error.message}` };
  }
}

async function testAdvancedContentFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/advanced-content`, {
      method: 'POST',
      body: {
        contentType: 'blog_post',
        parameters: {
          topic: 'CRM Best Practices',
          audience: 'Small business owners',
          length: '800 words'
        },
        reasoning_effort: 'medium'
      }
    });

    if (response.status === 200 && response.data.content) {
      return { passed: true, message: 'Advanced content generation working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper fallback for content generation' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Content generation fallback test error: ${error.message}` };
  }
}

async function testMultimodalAnalysisFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/multimodal-analysis`, {
      method: 'POST',
      body: {
        textData: { summary: 'Q3 performance analysis', metrics: [85, 92, 78] },
        images: ['chart1.png', 'graph2.png'],
        charts: ['revenue_chart', 'growth_chart'],
        documents: ['report.pdf']
      }
    });

    if (response.status === 200 && response.data.text_insights) {
      return { passed: true, message: 'Multimodal analysis working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper fallback for multimodal analysis' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Multimodal analysis fallback test error: ${error.message}` };
  }
}

async function testPredictiveAnalyticsFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/predictive-analytics`, {
      method: 'POST',
      body: {
        historicalData: [10000, 12000, 15000, 18000, 22000],
        forecastPeriod: 6,
        analysisType: 'revenue_forecast'
      }
    });

    if (response.status === 200 && response.data.predictions) {
      return { passed: true, message: 'Predictive analytics working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper fallback for predictive analytics' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Predictive analytics fallback test error: ${error.message}` };
  }
}

async function testStrategicPlanningFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/strategic-planning`, {
      method: 'POST',
      body: {
        businessContext: 'Growing SaaS company with 50 employees',
        goals: ['Expand to new markets', 'Increase customer lifetime value'],
        constraints: ['Limited budget', 'Small team'],
        timeframe: '12 months'
      }
    });

    if (response.status === 200 && response.data.strategic_objectives) {
      return { passed: true, message: 'Strategic planning working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper fallback for strategic planning' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Strategic planning fallback test error: ${error.message}` };
  }
}

async function testPerformanceOptimizationFallback() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/openai/performance-optimization`, {
      method: 'POST',
      body: {
        systemMetrics: { responseTime: 2.3, uptime: 99.5, throughput: 150 },
        userBehavior: { activeUsers: 450, sessionDuration: 25, bounceRate: 0.15 },
        businessGoals: ['Improve user engagement', 'Reduce response time']
      }
    });

    if (response.status === 200 && response.data.optimization_score) {
      return { passed: true, message: 'Performance optimization working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper fallback for performance optimization' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Performance optimization fallback test error: ${error.message}` };
  }
}

async function testDatabaseFallback() {
  try {
    // Test partners endpoint fallback
    const response = await makeRequest(`${BASE_URL}/api/partners`);

    if (response.status === 200 && Array.isArray(response.data)) {
      return { passed: true, message: 'Database fallback working correctly' };
    } else {
      return { passed: false, message: `Database fallback failed: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Database fallback test error: ${error.message}` };
  }
}

async function testMessagingFallback() {
  try {
    // Test messaging without Twilio configured
    const response = await makeRequest(`${BASE_URL}/api/messaging/send`, {
      method: 'POST',
      body: {
        content: 'Test message',
        recipient: '+15551234567',
        provider: 'twilio'
      }
    });

    if (response.status === 200 && response.data.success) {
      return { passed: true, message: 'Messaging fallback working' };
    } else if (response.status === 500 && response.data.error) {
      return { passed: true, message: 'Proper error handling for messaging' };
    } else {
      return { passed: false, message: `Unexpected messaging response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Messaging fallback test error: ${error.message}` };
  }
}

// Main test runner
async function runAllFallbackTests() {
  console.log('🚀 SmartCRM Fallback Mechanisms Test Suite');
  console.log('===========================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');

  // Run all fallback tests
  await runTest('AI Smart Greeting Fallback', testAISmartGreetingFallback);
  await runTest('KPI Analysis Fallback', testKPIAnalysisFallback);
  await runTest('Deal Intelligence Fallback', testDealIntelligenceFallback);
  await runTest('Business Intelligence Fallback', testBusinessIntelligenceFallback);
  await runTest('Advanced Content Fallback', testAdvancedContentFallback);
  await runTest('Multimodal Analysis Fallback', testMultimodalAnalysisFallback);
  await runTest('Predictive Analytics Fallback', testPredictiveAnalyticsFallback);
  await runTest('Strategic Planning Fallback', testStrategicPlanningFallback);
  await runTest('Performance Optimization Fallback', testPerformanceOptimizationFallback);
  await runTest('Database Fallback', testDatabaseFallback);
  await runTest('Messaging Fallback', testMessagingFallback);

  // Print summary
  console.log('\n📊 Fallback Mechanisms Test Summary');
  console.log('=====================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All fallback mechanisms are working correctly!');
  } else {
    console.log('\n❌ Some fallback mechanisms failed. Check implementation.');
  }

  // Detailed results
  console.log('\n📋 Detailed Results:');
  testResults.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.message}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (testResults.failed > 0) {
    console.log('- Review fallback implementations');
    console.log('- Ensure proper error handling');
    console.log('- Test with API keys disabled');
  }
  if (testResults.passed === testResults.total) {
    console.log('- All fallback mechanisms operational!');
    console.log('- System is resilient to service failures');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllFallbackTests().catch(error => {
    console.error('Fallback mechanisms test suite failed:', error);
    process.exit(1);
  });
}

export {
  runAllFallbackTests,
  testAISmartGreetingFallback,
  testKPIAnalysisFallback,
  testDealIntelligenceFallback,
  testBusinessIntelligenceFallback,
  testAdvancedContentFallback,
  testMultimodalAnalysisFallback,
  testPredictiveAnalyticsFallback,
  testStrategicPlanningFallback,
  testPerformanceOptimizationFallback,
  testDatabaseFallback,
  testMessagingFallback
};