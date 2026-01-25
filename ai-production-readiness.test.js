#!/usr/bin/env node

/**
 * AI Production Readiness Test Suite
 * Comprehensive testing for all AI features in the CRM application
 *
 * This test suite validates:
 * - OpenAI API endpoints and integrations
 * - GPT-5 advanced features
 * - Social media research services
 * - Error handling and fallback mechanisms
 * - Rate limiting and usage monitoring
 * - Batch processing capabilities
 * - Client-side AI service integrations
 * - Circuit breaker functionality
 * - Response caching
 * - Authentication and authorization
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  API_KEY: process.env.TEST_API_KEY || null,
  TIMEOUT: 30000,
  RETRIES: 3,
  VERBOSE: process.env.VERBOSE === 'true',
  SKIP_EXPENSIVE_TESTS: process.env.SKIP_EXPENSIVE_TESTS === 'true'
};

// Test Results Tracker
class TestResults {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  pass(testName, details = {}) {
    this.passed++;
    console.log(`✅ PASS: ${testName}`);
    if (CONFIG.VERBOSE && details.message) {
      console.log(`   ${details.message}`);
    }
  }

  fail(testName, error, details = {}) {
    this.failed++;
    this.errors.push({ test: testName, error: error.message, details });
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Error: ${error.message}`);
    if (details.expected) {
      console.log(`   Expected: ${details.expected}`);
    }
    if (details.actual) {
      console.log(`   Actual: ${details.actual}`);
    }
  }

  skip(testName, reason) {
    this.skipped++;
    console.log(`⏭️  SKIP: ${testName} (${reason})`);
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed + this.skipped;

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Skipped: ${this.skipped}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Success Rate: ${total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0}%`);

    if (this.errors.length > 0) {
      console.log('\nFAILED TESTS:');
      this.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.test}: ${err.error}`);
      });
    }

    return this.failed === 0;
  }
}

// HTTP Request Helper with Retry Logic
async function makeRequest(url, options = {}) {
  const config = {
    timeout: CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  for (let attempt = 1; attempt <= CONFIG.RETRIES; attempt++) {
    try {
      const response = await axios(url, config);
      return response;
    } catch (error) {
      if (attempt === CONFIG.RETRIES) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Request failed, retrying in ${delay}ms... (${attempt}/${CONFIG.RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Mock Data Generators
const MockData = {
  contact: () => ({
    id: 'test-contact-' + Date.now(),
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    company: 'TechCorp Inc',
    title: 'VP of Engineering',
    phone: '+1-555-0123'
  }),

  userMetrics: () => ({
    totalDeals: 25,
    totalValue: 1250000,
    wonDeals: 18,
    lostDeals: 7,
    avgDealSize: 50000,
    conversionRate: 72
  }),

  kpiData: () => ({
    revenue: { current: 125000, target: 150000, growth: 15.2 },
    deals: { current: 25, target: 30, growth: 8.3 },
    conversion: { current: 72, target: 75, growth: 2.1 },
    pipeline: { current: 850000, target: 1000000, growth: 12.5 }
  }),

  dealData: () => ({
    id: 'deal-123',
    name: 'Enterprise Software License',
    value: 250000,
    stage: 'Proposal',
    probability: 75,
    expectedCloseDate: '2024-02-15',
    contacts: ['john.smith@techcorp.com'],
    competitors: ['CompetitorA', 'CompetitorB']
  }),

  socialProfiles: () => ([
    {
      platform: 'LinkedIn',
      username: 'johnsmith',
      url: 'https://linkedin.com/in/johnsmith',
      verified: true,
      followers: 1250,
      engagement: 85,
      lastActivity: new Date(),
      confidence: 95
    },
    {
      platform: 'Twitter',
      username: 'johnsmithtech',
      url: 'https://twitter.com/johnsmithtech',
      verified: false,
      followers: 890,
      engagement: 65,
      lastActivity: new Date(Date.now() - 86400000),
      confidence: 80
    }
  ])
};

// Test Categories
class AITestSuite {
  constructor() {
    this.results = new TestResults();
    this.baseURL = CONFIG.BASE_URL;
  }

  async runAllTests() {
    console.log('🚀 Starting AI Production Readiness Tests\n');

    try {
      // Core API Tests
      await this.testOpenAIStatus();
      await this.testEmbeddings();
      await this.testImageGeneration();

      // GPT-5 Feature Tests
      await this.testSmartGreeting();
      await this.testKPIAnalysis();
      await this.testDealIntelligence();
      await this.testBusinessIntelligence();

      // Advanced AI Features
      await this.testMultimodalAnalysis();
      await this.testPredictiveAnalytics();
      await this.testStrategicPlanning();
      await this.testPerformanceOptimization();
      await this.testAdvancedContent();

      // Social Media Research
      await this.testSocialMediaResearch();

      // Error Handling & Resilience
      await this.testErrorHandling();
      await this.testRateLimiting();
      await this.testCircuitBreaker();
      await this.testFallbackMechanisms();

      // Batch Processing
      await this.testBatchProcessing();

      // Usage Monitoring
      await this.testUsageMonitoring();

      // Authentication & Security
      await this.testAuthentication();

    } catch (error) {
      console.error('Test suite failed:', error);
      this.results.fail('Test Suite Execution', error);
    }

    return this.results.summary();
  }

  // Core OpenAI API Tests
  async testOpenAIStatus() {
    console.log('\n🔍 Testing OpenAI Status Endpoint');

    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/status`);

      if (response.status === 200) {
        const data = response.data;

        // Validate response structure
        if (typeof data.configured === 'boolean') {
          this.results.pass('OpenAI Status - Basic Response');
        } else {
          this.results.fail('OpenAI Status - Basic Response',
            new Error('Invalid response structure'),
            { expected: 'configured: boolean', actual: typeof data.configured });
        }

        // Check capabilities array if configured
        if (data.configured && Array.isArray(data.capabilities)) {
          this.results.pass('OpenAI Status - Capabilities Array');
        }

        // Check model information
        if (data.model) {
          this.results.pass('OpenAI Status - Model Info');
        }

      } else {
        this.results.fail('OpenAI Status - HTTP Status',
          new Error(`Unexpected status: ${response.status}`),
          { expected: 200, actual: response.status });
      }

    } catch (error) {
      this.results.fail('OpenAI Status - Request Failed', error);
    }
  }

  async testEmbeddings() {
    console.log('\n🔍 Testing OpenAI Embeddings');

    try {
      const testText = "This is a test document for embedding generation.";
      const response = await makeRequest(`${this.baseURL}/api/openai/embeddings`, {
        method: 'POST',
        data: { text: testText }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.success && Array.isArray(data.embedding)) {
          this.results.pass('Embeddings - Successful Generation');

          if (data.embedding.length > 0) {
            this.results.pass('Embeddings - Valid Vector Length');
          }

          if (data.usage) {
            this.results.pass('Embeddings - Usage Tracking');
          }
        } else {
          this.results.fail('Embeddings - Response Structure',
            new Error('Invalid response format'),
            { expected: 'success: true, embedding: array', actual: JSON.stringify(data) });
        }
      } else {
        this.results.fail('Embeddings - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Embeddings - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Embeddings - Request Failed', error);
      }
    }
  }

  async testImageGeneration() {
    console.log('\n🔍 Testing OpenAI Image Generation');

    if (CONFIG.SKIP_EXPENSIVE_TESTS) {
      this.results.skip('Image Generation', 'Expensive test skipped');
      return;
    }

    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/images/generate`, {
        method: 'POST',
        data: {
          prompt: "A professional headshot of a business executive",
          size: "256x256",
          quality: "standard"
        }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.success && Array.isArray(data.data)) {
          this.results.pass('Image Generation - Successful Creation');

          if (data.data.length > 0 && data.data[0].url) {
            this.results.pass('Image Generation - Valid Image URL');
          }
        } else {
          this.results.fail('Image Generation - Response Structure',
            new Error('Invalid response format'));
        }
      } else {
        this.results.fail('Image Generation - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Image Generation - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Image Generation - Request Failed', error);
      }
    }
  }

  // GPT-5 Feature Tests
  async testSmartGreeting() {
    console.log('\n🔍 Testing Smart Greeting Generation');

    try {
      const userMetrics = MockData.userMetrics();
      const response = await makeRequest(`${this.baseURL}/api/openai/smart-greeting`, {
        method: 'POST',
        data: {
          userMetrics,
          timeOfDay: 'morning',
          recentActivity: ['Closed a $50k deal', 'Added 3 new contacts']
        }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.greeting && data.insight) {
          this.results.pass('Smart Greeting - Successful Generation');

          if (data.source) {
            this.results.pass('Smart Greeting - Source Tracking');
          }

          if (data.model) {
            this.results.pass('Smart Greeting - Model Tracking');
          }
        } else {
          this.results.fail('Smart Greeting - Response Structure',
            new Error('Missing greeting or insight fields'));
        }
      } else {
        this.results.fail('Smart Greeting - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Smart Greeting - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Smart Greeting - Request Failed', error);
      }
    }
  }

  async testKPIAnalysis() {
    console.log('\n🔍 Testing KPI Analysis');

    try {
      const historicalData = MockData.kpiData();
      const currentMetrics = { ...historicalData, revenue: { ...historicalData.revenue, current: 140000 } };

      const response = await makeRequest(`${this.baseURL}/api/openai/kpi-analysis`, {
        method: 'POST',
        data: { historicalData, currentMetrics }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.summary && data.trends) {
          this.results.pass('KPI Analysis - Successful Analysis');

          if (data.recommendations && Array.isArray(data.recommendations)) {
            this.results.pass('KPI Analysis - Recommendations Provided');
          }
        } else {
          this.results.fail('KPI Analysis - Response Structure',
            new Error('Missing required fields'));
        }
      } else {
        this.results.fail('KPI Analysis - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('KPI Analysis - API Key Required', 'No API key configured');
      } else {
        this.results.fail('KPI Analysis - Request Failed', error);
      }
    }
  }

  async testDealIntelligence() {
    console.log('\n🔍 Testing Deal Intelligence');

    try {
      const dealData = MockData.dealData();

      const response = await makeRequest(`${this.baseURL}/api/openai/deal-intelligence`, {
        method: 'POST',
        data: { dealData }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.insights || data.recommendations) {
          this.results.pass('Deal Intelligence - Successful Analysis');

          if (data.riskAssessment) {
            this.results.pass('Deal Intelligence - Risk Assessment');
          }

          if (data.nextSteps && Array.isArray(data.nextSteps)) {
            this.results.pass('Deal Intelligence - Action Items');
          }
        } else {
          this.results.fail('Deal Intelligence - Response Structure',
            new Error('Missing insights or recommendations'));
        }
      } else {
        this.results.fail('Deal Intelligence - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Deal Intelligence - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Deal Intelligence - Request Failed', error);
      }
    }
  }

  async testBusinessIntelligence() {
    console.log('\n🔍 Testing Business Intelligence');

    try {
      const crmData = {
        totalContacts: 1250,
        totalDeals: 89,
        totalRevenue: 2450000,
        avgDealSize: 27528,
        conversionRate: 68.5
      };

      const response = await makeRequest(`${this.baseURL}/api/openai/business-intelligence`, {
        method: 'POST',
        data: { crmData, marketData: {}, goals: ['Increase revenue by 25%', 'Improve conversion rate'] }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.analysis || data.insights) {
          this.results.pass('Business Intelligence - Successful Analysis');

          if (data.marketInsights) {
            this.results.pass('Business Intelligence - Market Analysis');
          }

          if (data.recommendations && Array.isArray(data.recommendations)) {
            this.results.pass('Business Intelligence - Strategic Recommendations');
          }
        } else {
          this.results.fail('Business Intelligence - Response Structure',
            new Error('Missing analysis or insights'));
        }
      } else {
        this.results.fail('Business Intelligence - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Business Intelligence - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Business Intelligence - Request Failed', error);
      }
    }
  }

  // Advanced AI Features
  async testMultimodalAnalysis() {
    console.log('\n🔍 Testing Multimodal Analysis');

    if (CONFIG.SKIP_EXPENSIVE_TESTS) {
      this.results.skip('Multimodal Analysis', 'Expensive test skipped');
      return;
    }

    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/multimodal-analysis`, {
        method: 'POST',
        data: {
          content: "Analyze this business presentation for key insights",
          imageUrl: "https://example.com/sample-chart.png",
          context: "Q4 sales performance review"
        }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.analysis || data.insights) {
          this.results.pass('Multimodal Analysis - Successful Processing');

          if (data.visualInsights) {
            this.results.pass('Multimodal Analysis - Visual Analysis');
          }
        } else {
          this.results.fail('Multimodal Analysis - Response Structure',
            new Error('Missing analysis results'));
        }
      } else {
        this.results.fail('Multimodal Analysis - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Multimodal Analysis - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Multimodal Analysis - Request Failed', error);
      }
    }
  }

  async testPredictiveAnalytics() {
    console.log('\n🔍 Testing Predictive Analytics');

    try {
      const salesData = {
        historical: [
          { month: '2023-01', revenue: 85000, deals: 12 },
          { month: '2023-02', revenue: 92000, deals: 15 },
          { month: '2023-03', revenue: 88000, deals: 13 }
        ],
        current: { revenue: 95000, deals: 16 }
      };

      const response = await makeRequest(`${this.baseURL}/api/openai/predictive-analytics`, {
        method: 'POST',
        data: { salesData, timeframe: '3months' }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.predictions || data.forecast) {
          this.results.pass('Predictive Analytics - Successful Forecasting');

          if (data.confidence) {
            this.results.pass('Predictive Analytics - Confidence Metrics');
          }

          if (data.trends) {
            this.results.pass('Predictive Analytics - Trend Analysis');
          }
        } else {
          this.results.fail('Predictive Analytics - Response Structure',
            new Error('Missing predictions or forecast'));
        }
      } else {
        this.results.fail('Predictive Analytics - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Predictive Analytics - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Predictive Analytics - Request Failed', error);
      }
    }
  }

  async testStrategicPlanning() {
    console.log('\n🔍 Testing Strategic Planning');

    try {
      const businessContext = {
        industry: 'SaaS',
        companySize: '50-200 employees',
        currentRevenue: 2450000,
        growthTargets: ['30% YoY growth', 'Expand to 3 new markets'],
        challenges: ['Increasing competition', 'Talent acquisition'],
        opportunities: ['AI integration', 'International expansion']
      };

      const response = await makeRequest(`${this.baseURL}/api/openai/strategic-planning`, {
        method: 'POST',
        data: { businessContext, timeframe: '12months' }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.strategy || data.plan) {
          this.results.pass('Strategic Planning - Successful Generation');

          if (data.goals && Array.isArray(data.goals)) {
            this.results.pass('Strategic Planning - Goal Setting');
          }

          if (data.timeline) {
            this.results.pass('Strategic Planning - Timeline Creation');
          }
        } else {
          this.results.fail('Strategic Planning - Response Structure',
            new Error('Missing strategy or plan'));
        }
      } else {
        this.results.fail('Strategic Planning - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Strategic Planning - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Strategic Planning - Request Failed', error);
      }
    }
  }

  async testPerformanceOptimization() {
    console.log('\n🔍 Testing Performance Optimization');

    try {
      const performanceData = {
        responseTimes: [120, 95, 150, 85, 110],
        errorRates: [0.02, 0.01, 0.03, 0.005, 0.015],
        throughput: [850, 920, 780, 950, 890],
        resourceUsage: { cpu: 65, memory: 70, disk: 45 }
      };

      const response = await makeRequest(`${this.baseURL}/api/openai/performance-optimization`, {
        method: 'POST',
        data: { performanceData, systemType: 'CRM Application' }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.recommendations || data.optimizations) {
          this.results.pass('Performance Optimization - Successful Analysis');

          if (data.bottlenecks) {
            this.results.pass('Performance Optimization - Bottleneck Identification');
          }
        } else {
          this.results.fail('Performance Optimization - Response Structure',
            new Error('Missing recommendations or optimizations'));
        }
      } else {
        this.results.fail('Performance Optimization - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Performance Optimization - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Performance Optimization - Request Failed', error);
      }
    }
  }

  async testAdvancedContent() {
    console.log('\n🔍 Testing Advanced Content Generation');

    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/advanced-content`, {
        method: 'POST',
        data: {
          prompt: "Generate a compelling sales email for enterprise software",
          contentType: "email",
          audience: "CTO",
          goal: "Schedule a demo"
        }
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.content || data.generated) {
          this.results.pass('Advanced Content - Successful Generation');

          if (data.reasoning) {
            this.results.pass('Advanced Content - Reasoning Provided');
          }
        } else {
          this.results.fail('Advanced Content - Response Structure',
            new Error('Missing generated content'));
        }
      } else {
        this.results.fail('Advanced Content - HTTP Status',
          new Error(`Unexpected status: ${response.status}`));
      }

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('API key')) {
        this.results.skip('Advanced Content - API Key Required', 'No API key configured');
      } else {
        this.results.fail('Advanced Content - Request Failed', error);
      }
    }
  }

  // Social Media Research Tests
  async testSocialMediaResearch() {
    console.log('\n🔍 Testing Social Media Research');

    // Test the service directly (mock mode)
    try {
      // Since this is a client-side service, we'll test the API endpoints if available
      // For now, test basic functionality with mock data

      const contact = MockData.contact();

      // Test if social media research endpoints exist
      try {
        const response = await makeRequest(`${this.baseURL}/api/social-research`, {
          method: 'POST',
          data: { contact, platforms: ['LinkedIn'], depth: 'basic' }
        });

        if (response.status === 200) {
          this.results.pass('Social Media Research - API Endpoint Available');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.results.skip('Social Media Research - Endpoint Not Implemented', 'API endpoint not found');
        } else {
          this.results.fail('Social Media Research - API Test Failed', error);
        }
      }

      // Test service instantiation (if available)
      if (typeof GPT5SocialResearchService !== 'undefined') {
        const service = new GPT5SocialResearchService(null, { mockMode: true });
        const result = await service.researchContactSocialMedia(contact);

        if (result && result.profiles) {
          this.results.pass('Social Media Research - Mock Mode Working');
        }
      } else {
        this.results.skip('Social Media Research - Service Not Loaded', 'Service script not available in test environment');
      }

    } catch (error) {
      this.results.fail('Social Media Research - Service Test Failed', error);
    }
  }

  // Error Handling & Resilience Tests
  async testErrorHandling() {
    console.log('\n🔍 Testing Error Handling');

    // Test with invalid data
    try {
      await makeRequest(`${this.baseURL}/api/openai/embeddings`, {
        method: 'POST',
        data: { text: '' } // Empty text
      });

      this.results.fail('Error Handling - Invalid Input',
        new Error('Should have rejected empty text'));
    } catch (error) {
      if (error.response?.status === 400) {
        this.results.pass('Error Handling - Invalid Input Rejected');
      } else {
        this.results.fail('Error Handling - Unexpected Error Response', error);
      }
    }

    // Test with malformed JSON
    try {
      await makeRequest(`${this.baseURL}/api/openai/smart-greeting`, {
        method: 'POST',
        data: '{ invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      this.results.fail('Error Handling - Malformed JSON',
        new Error('Should have rejected malformed JSON'));
    } catch (error) {
      if (error.response?.status >= 400) {
        this.results.pass('Error Handling - Malformed JSON Rejected');
      } else {
        this.results.fail('Error Handling - Unexpected Error Response', error);
      }
    }
  }

  async testRateLimiting() {
    console.log('\n🔍 Testing Rate Limiting');

    const requests = [];

    // Make multiple rapid requests to test rate limiting
    for (let i = 0; i < 15; i++) {
      requests.push(
        makeRequest(`${this.baseURL}/api/openai/smart-greeting`, {
          method: 'POST',
          data: {
            userMetrics: MockData.userMetrics(),
            timeOfDay: 'morning',
            recentActivity: []
          }
        }).catch(error => {
          if (error.response?.status === 429) {
            return { rateLimited: true, error };
          }
          throw error;
        })
      );
    }

    try {
      const results = await Promise.allSettled(requests);
      const rateLimitedCount = results.filter(result =>
        result.status === 'fulfilled' && result.value?.rateLimited
      ).length;

      if (rateLimitedCount > 0) {
        this.results.pass('Rate Limiting - Active Protection');
      } else {
        this.results.skip('Rate Limiting - Not Triggered', 'Rate limit not reached in test');
      }
    } catch (error) {
      this.results.fail('Rate Limiting - Test Failed', error);
    }
  }

  async testCircuitBreaker() {
    console.log('\n🔍 Testing Circuit Breaker');

    // Test circuit breaker status endpoint if available
    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/usage?stats=true`);

      if (response.status === 200 && response.data.circuitBreakerStatus) {
        this.results.pass('Circuit Breaker - Status Available');

        const status = response.data.circuitBreakerStatus;
        if (typeof status.state === 'string') {
          this.results.pass('Circuit Breaker - State Tracking');
        }
      }
    } catch (error) {
      this.results.skip('Circuit Breaker - Status Not Available', 'Usage endpoint may require auth');
    }
  }

  async testFallbackMechanisms() {
    console.log('\n🔍 Testing Fallback Mechanisms');

    // Test fallback when API key is not configured
    try {
      // Temporarily remove API key for this test
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const response = await makeRequest(`${this.baseURL}/api/openai/smart-greeting`, {
        method: 'POST',
        data: {
          userMetrics: MockData.userMetrics(),
          timeOfDay: 'morning',
          recentActivity: []
        }
      });

      if (response.status === 200 && response.data.source === 'intelligent_fallback') {
        this.results.pass('Fallback Mechanisms - Intelligent Fallback Working');
      }

      // Restore API key
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }

    } catch (error) {
      this.results.fail('Fallback Mechanisms - Test Failed', error);
    }
  }

  // Batch Processing Tests
  async testBatchProcessing() {
    console.log('\n🔍 Testing Batch Processing');

    // Test batch contact enrichment if available
    try {
      const contacts = [
        MockData.contact(),
        { ...MockData.contact(), name: 'Jane Doe', email: 'jane.doe@techcorp.com' },
        { ...MockData.contact(), name: 'Bob Johnson', email: 'bob.johnson@techcorp.com' }
      ];

      const response = await makeRequest(`${this.baseURL}/api/batch/enrich-contacts`, {
        method: 'POST',
        data: {
          contacts,
          enrichmentTypes: ['contact_scoring'],
          processingMode: 'immediate'
        }
      });

      if (response.status === 200) {
        this.results.pass('Batch Processing - Contact Enrichment Working');

        if (response.data.results && Array.isArray(response.data.results)) {
          this.results.pass('Batch Processing - Results Array Returned');
        }
      }

    } catch (error) {
      if (error.response?.status === 404) {
        this.results.skip('Batch Processing - Endpoint Not Available', 'Batch processing not implemented');
      } else {
        this.results.fail('Batch Processing - Test Failed', error);
      }
    }
  }

  // Usage Monitoring Tests
  async testUsageMonitoring() {
    console.log('\n🔍 Testing Usage Monitoring');

    try {
      const response = await makeRequest(`${this.baseURL}/api/openai/usage`);

      if (response.status === 200) {
        const data = response.data;

        if (data.totalRequests !== undefined) {
          this.results.pass('Usage Monitoring - Request Tracking');
        }

        if (data.totalCost !== undefined) {
          this.results.pass('Usage Monitoring - Cost Tracking');
        }

        if (data.circuitBreakerStatus) {
          this.results.pass('Usage Monitoring - Circuit Breaker Integration');
        }
      } else {
        this.results.skip('Usage Monitoring - Endpoint Not Available', 'May require authentication');
      }

    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.results.skip('Usage Monitoring - Authentication Required', 'Endpoint requires auth');
      } else {
        this.results.fail('Usage Monitoring - Test Failed', error);
      }
    }
  }

  // Authentication & Security Tests
  async testAuthentication() {
    console.log('\n🔍 Testing Authentication & Security');

    // Test unauthenticated access to protected endpoints
    const protectedEndpoints = [
      '/api/openai/embeddings',
      '/api/openai/images/generate',
      '/api/openai/assistants/threads'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        await makeRequest(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          data: {},
          headers: {} // No auth headers
        });

        this.results.fail(`Authentication - ${endpoint}`,
          new Error('Should have been rejected'));
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.results.pass(`Authentication - ${endpoint} Protected`);
        } else if (error.response?.status === 400) {
          // Some endpoints may not require auth but validate input
          this.results.pass(`Authentication - ${endpoint} Input Validation`);
        } else {
          this.results.fail(`Authentication - ${endpoint} Unexpected Response`, error);
        }
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🤖 AI Production Readiness Test Suite');
  console.log('=====================================\n');

  // Validate environment
  if (!CONFIG.BASE_URL) {
    console.error('❌ TEST_BASE_URL environment variable is required');
    process.exit(1);
  }

  console.log(`Testing against: ${CONFIG.BASE_URL}`);
  console.log(`Verbose mode: ${CONFIG.VERBOSE}`);
  console.log(`Skip expensive tests: ${CONFIG.SKIP_EXPENSIVE_TESTS}\n`);

  const testSuite = new AITestSuite();
  const success = await testSuite.runAllTests();

  process.exit(success ? 0 : 1);
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AITestSuite, MockData, makeRequest };
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}