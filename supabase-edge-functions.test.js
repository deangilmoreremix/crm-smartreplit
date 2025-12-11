#!/usr/bin/env node

/**
 * Supabase Edge Functions Test Suite
 * Tests all edge functions with proper authentication and error handling
 * Run with: node supabase-edge-functions.test.js
 */

import https from 'https';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make authenticated requests to edge functions
function callEdgeFunction(functionName, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      reject(new Error('Supabase credentials not configured'));
      return;
    }

    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const data = JSON.stringify(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'User-Agent': 'SmartCRM-Edge-Function-Test/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
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

// Individual edge function tests
async function testAnalyzeSentiment() {
  try {
    const response = await callEdgeFunction('analyze-sentiment', {
      text: "I love this product! It's amazing and works perfectly.",
      customerId: "test-customer-123",
      model: "gpt-4o-mini"
    });

    if (response.status === 200 && response.data.sentiment) {
      return {
        passed: true,
        message: `Sentiment: ${response.data.sentiment}, Confidence: ${response.data.score || response.data.confidence || 'N/A'}`
      };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status} - ${JSON.stringify(response.data)}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testContactsFunction() {
  try {
    const response = await callEdgeFunction('contacts', {
      action: 'list',
      limit: 10,
      customerId: "test-customer-123"
    });

    if (response.status === 200) {
      return { passed: true, message: 'Contacts function responding correctly' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testDealsFunction() {
  try {
    const response = await callEdgeFunction('deals', {
      action: 'list',
      stage: 'qualification',
      customerId: "test-customer-123"
    });

    if (response.status === 200) {
      return { passed: true, message: 'Deals function responding correctly' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testDraftEmailResponse() {
  try {
    const response = await callEdgeFunction('draft-email-response', {
      customerEmail: "Hello, I need help with my order.",
      context: "Customer is asking about order status",
      tone: "professional",
      customerId: "test-customer-123"
    });

    if (response.status === 200 && response.data.response) {
      return { passed: true, message: 'Email draft generated successfully' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testGenerateSalesPitch() {
  try {
    const response = await callEdgeFunction('generate-sales-pitch', {
      product: "SmartCRM Platform",
      targetAudience: "Small business owners",
      keyBenefits: ["AI automation", "Easy setup", "Cost effective"],
      customerId: "test-customer-123"
    });

    if (response.status === 200 && response.data.pitch) {
      return { passed: true, message: 'Sales pitch generated successfully' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testNaturalLanguageQuery() {
  try {
    const response = await callEdgeFunction('natural-language-query', {
      query: "Show me all deals over $50,000 in the proposal stage",
      customerId: "test-customer-123",
      context: "sales_dashboard"
    });

    if (response.status === 200) {
      return { passed: true, message: 'Natural language query processed' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testPrioritizeTasks() {
  try {
    const response = await callEdgeFunction('prioritize-tasks', {
      tasks: [
        { id: "1", title: "Follow up with lead", urgency: "high" },
        { id: "2", title: "Update contact info", urgency: "medium" },
        { id: "3", title: "Send proposal", urgency: "high" }
      ],
      customerId: "test-customer-123"
    });

    if (response.status === 200 && response.data.prioritizedTasks) {
      return { passed: true, message: 'Tasks prioritized successfully' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testSummarizeCustomerNotes() {
  try {
    const response = await callEdgeFunction('summarize-customer-notes', {
      notes: [
        "Customer called about billing issue",
        "Requested refund for last month's service",
        "Mentioned they were satisfied with support",
        "Asked about upgrading to premium plan"
      ],
      customerId: "test-customer-123"
    });

    if (response.status === 200 && response.data.summary) {
      return { passed: true, message: 'Customer notes summarized successfully' };
    } else {
      return { passed: false, message: `Unexpected response: ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Function call failed: ${error.message}` };
  }
}

async function testErrorHandling() {
  try {
    // Test with invalid payload
    const response = await callEdgeFunction('analyze-sentiment', {
      invalidField: "test"
    });

    if (response.status === 400) {
      return { passed: true, message: 'Error handling working correctly' };
    } else {
      return { passed: false, message: `Expected 400 error, got ${response.status}` };
    }
  } catch (error) {
    return { passed: false, message: `Error handling test failed: ${error.message}` };
  }
}

async function testCORSHeaders() {
  try {
    const response = await callEdgeFunction('analyze-sentiment', {
      text: "Test CORS",
      customerId: "test-customer-123"
    });

    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders === '*') {
      return { passed: true, message: 'CORS headers configured correctly' };
    } else {
      return { passed: false, message: `CORS headers missing or incorrect: ${corsHeaders}` };
    }
  } catch (error) {
    return { passed: false, message: `CORS test failed: ${error.message}` };
  }
}

// Main test runner
async function runAllEdgeFunctionTests() {
  console.log('🚀 SmartCRM Supabase Edge Functions Test Suite');
  console.log('================================================');
  console.log(`Testing against: ${SUPABASE_URL || 'Not configured'}`);
  console.log('');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Supabase credentials not configured!');
    console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    process.exit(1);
  }

  // Run all edge function tests
  await runTest('Analyze Sentiment Function', testAnalyzeSentiment);
  await runTest('Contacts Function', testContactsFunction);
  await runTest('Deals Function', testDealsFunction);
  await runTest('Draft Email Response Function', testDraftEmailResponse);
  await runTest('Generate Sales Pitch Function', testGenerateSalesPitch);
  await runTest('Natural Language Query Function', testNaturalLanguageQuery);
  await runTest('Prioritize Tasks Function', testPrioritizeTasks);
  await runTest('Summarize Customer Notes Function', testSummarizeCustomerNotes);
  await runTest('Error Handling', testErrorHandling);
  await runTest('CORS Headers', testCORSHeaders);

  // Print summary
  console.log('\n📊 Edge Functions Test Summary');
  console.log('================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All edge functions are working correctly!');
  } else {
    console.log('\n❌ Some edge functions failed. Check deployment and configuration.');
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
    console.log('- Check edge function deployments');
    console.log('- Verify environment variables');
    console.log('- Review function logs in Supabase dashboard');
    console.log('- Ensure proper authentication setup');
  }
  if (testResults.passed === testResults.total) {
    console.log('- All edge functions operational!');
    console.log('- Consider setting up automated monitoring');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllEdgeFunctionTests().catch(error => {
    console.error('Edge functions test suite failed:', error);
    process.exit(1);
  });
}

export {
  runAllEdgeFunctionTests,
  testAnalyzeSentiment,
  testContactsFunction,
  testDealsFunction,
  testDraftEmailResponse,
  testGenerateSalesPitch,
  testNaturalLanguageQuery,
  testPrioritizeTasks,
  testSummarizeCustomerNotes,
  testErrorHandling,
  testCORSHeaders
};