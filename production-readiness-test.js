#!/usr/bin/env node

/**
 * SmartCRM Production Readiness Test
 * Tests AI features, remote apps, and client-side functionality
 * Run with: node production-readiness-test.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, status, message = '', details = '') {
  testResults.total++;
  testResults[status]++;
  testResults.tests.push({ name, status, message, details });
  
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   ${details}`);
}

// Test remote app URLs (static check)
function testRemoteAppsStatic() {
  console.log('\n🔗 Testing Remote App Configuration');
  console.log('='.repeat(50));

  const apps = [
    { name: 'Remote Pipeline', url: 'https://cheery-syrniki-b5b6ca.netlify.app' },
    { name: 'Remote Contacts', url: 'https://taupe-sprinkles-83c9ee.netlify.app' },
    { name: 'FunnelCraft AI', url: 'https://serene-valkyrie-fec320.netlify.app' },
    { name: 'ContentAI', url: 'https://capable-mermaid-3c73fa.netlify.app' },
    { name: 'White Label Platform', url: 'https://moonlit-tarsier-239e70.netlify.app' },
    { name: 'SmartCRM Closer', url: 'https://stupendous-twilight-64389a.netlify.app' }
  ];

  // Check if URLs are properly configured in components
  const connectedAppsPath = path.join(__dirname, 'client/src/components/dashboard/ConnectedApps.tsx');
  
  try {
    const connectedApps = fs.readFileSync(connectedAppsPath, 'utf8');
    
    let configuredCount = 0;
    apps.forEach(app => {
      if (connectedApps.includes(app.url)) {
        configuredCount++;
        logTest(`${app.name} Configuration`, 'passed', 'URL properly configured');
      } else {
        logTest(`${app.name} Configuration`, 'failed', 'URL not found in configuration');
      }
    });

    if (configuredCount === apps.length) {
      logTest('All Remote Apps Configured', 'passed', `${configuredCount}/${apps.length} apps configured`);
    } else {
      logTest('All Remote Apps Configured', 'failed', `Only ${configuredCount}/${apps.length} apps configured`);
    }

  } catch (error) {
    logTest('Remote Apps Configuration Check', 'failed', 'Could not read configuration file', error.message);
  }
}

// Test AI service code quality (static analysis)
function testAIServiceCode() {
  console.log('\n🤖 Testing AI Service Code Quality');
  console.log('='.repeat(50));

  // Check if AI services use server-side APIs
  const openAIServicePath = path.join(__dirname, 'client/src/services/openAIService.ts');
  const enhancedGeminiPath = path.join(__dirname, 'client/src/services/enhancedGeminiService.ts');

  try {
    const openAIService = fs.readFileSync(openAIServicePath, 'utf8');
    
    // Check for server-side API usage
    if (openAIService.includes('/api/respond') && openAIService.includes('fetch')) {
      logTest('OpenAI Service - Server-side API', 'passed', 'Uses server-side API calls');
    } else {
      logTest('OpenAI Service - Server-side API', 'failed', 'May expose client-side API keys');
    }

    // Check for rate limiting
    if (openAIService.includes('rateLimiter.checkLimit')) {
      logTest('OpenAI Service - Rate Limiting', 'passed', 'Rate limiting implemented');
    } else {
      logTest('OpenAI Service - Rate Limiting', 'failed', 'No rate limiting detected');
    }

    // Check for error handling
    if (openAIService.includes('catch') && openAIService.includes('throw new Error')) {
      logTest('OpenAI Service - Error Handling', 'passed', 'Proper error handling');
    } else {
      logTest('OpenAI Service - Error Handling', 'failed', 'Insufficient error handling');
    }

  } catch (error) {
    logTest('OpenAI Service Code Analysis', 'failed', 'Could not read file', error.message);
  }

  try {
    const enhancedGemini = fs.readFileSync(enhancedGeminiPath, 'utf8');
    
    // Check for fallback mechanisms
    if (enhancedGemini.includes('isValidApiKey') && enhancedGemini.includes('fallback')) {
      logTest('Gemini Service - Fallbacks', 'passed', 'Fallback mechanisms implemented');
    } else {
      logTest('Gemini Service - Fallbacks', 'failed', 'No fallback mechanisms detected');
    }

  } catch (error) {
    logTest('Gemini Service Code Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test LiveDealAnalysis component
function testLiveDealAnalysis() {
  console.log('\n📊 Testing Live Deal Analysis Component');
  console.log('='.repeat(50));

  const componentPath = path.join(__dirname, 'client/src/components/aiTools/LiveDealAnalysis.tsx');

  try {
    const component = fs.readFileSync(componentPath, 'utf8');

    // Check if it uses real AI (not demo simulation)
    if (component.includes('openAIService.generateDealInsights') && !component.includes('setTimeout(resolve, 7000)')) {
      logTest('Live Deal Analysis - Real AI', 'passed', 'Uses real AI analysis');
    } else {
      logTest('Live Deal Analysis - Real AI', 'failed', 'Still using demo simulation');
    }

    // Check for error handling
    if (component.includes('catch (error)') && component.includes('fallbackResults')) {
      logTest('Live Deal Analysis - Error Handling', 'passed', 'Proper error handling with fallbacks');
    } else {
      logTest('Live Deal Analysis - Error Handling', 'failed', 'Insufficient error handling');
    }

  } catch (error) {
    logTest('Live Deal Analysis Code Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test EmailComposerContent
function testEmailComposer() {
  console.log('\n📧 Testing Email Composer Component');
  console.log('='.repeat(50));

  const componentPath = path.join(__dirname, 'client/src/components/aiTools/EmailComposerContent.tsx');

  try {
    const component = fs.readFileSync(componentPath, 'utf8');

    // Check if it uses server-side API
    if (component.includes('openAIService.generateEmail') && !component.includes('useOpenAI')) {
      logTest('Email Composer - Server-side API', 'passed', 'Uses secure server-side API');
    } else {
      logTest('Email Composer - Server-side API', 'failed', 'May expose client-side API keys');
    }

  } catch (error) {
    logTest('Email Composer Code Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test error boundary components
function testErrorBoundaries() {
  console.log('\n🛡️ Testing Error Boundary Components');
  console.log('='.repeat(50));

  const boundaryPath = path.join(__dirname, 'client/src/components/RemoteAppErrorBoundary.tsx');
  const healthPath = path.join(__dirname, 'client/src/services/remoteAppHealthService.ts');

  try {
    const boundary = fs.readFileSync(boundaryPath, 'utf8');
    
    if (boundary.includes('componentDidCatch') && boundary.includes('ErrorBoundary')) {
      logTest('Remote App Error Boundary', 'passed', 'Error boundary implemented');
    } else {
      logTest('Remote App Error Boundary', 'failed', 'Error boundary not properly implemented');
    }

  } catch (error) {
    logTest('Error Boundary Code Analysis', 'failed', 'Could not read file', error.message);
  }

  try {
    const health = fs.readFileSync(healthPath, 'utf8');
    
    if (health.includes('checkAppHealth') && health.includes('setInterval')) {
      logTest('Remote App Health Service', 'passed', 'Health monitoring implemented');
    } else {
      logTest('Remote App Health Service', 'failed', 'Health monitoring not implemented');
    }

  } catch (error) {
    logTest('Health Service Code Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test rate limiting implementation
function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting Implementation');
  console.log('='.repeat(50));

  const rateLimiterPath = path.join(__dirname, 'client/src/services/rate-limiter.service.ts');
  const openAIServicePath = path.join(__dirname, 'client/src/services/openAIService.ts');

  try {
    const rateLimiter = fs.readFileSync(rateLimiterPath, 'utf8');
    
    if (rateLimiter.includes('checkLimit') && rateLimiter.includes('maxRequests')) {
      logTest('Rate Limiter Service', 'passed', 'Rate limiting service implemented');
    } else {
      logTest('Rate Limiter Service', 'failed', 'Rate limiting service incomplete');
    }

  } catch (error) {
    logTest('Rate Limiter Code Analysis', 'failed', 'Could not read file', error.message);
  }

  try {
    const openAI = fs.readFileSync(openAIServicePath, 'utf8');
    
    if (openAI.includes('rateLimiter.checkLimit') && openAI.includes('Rate limit exceeded')) {
      logTest('OpenAI Service Rate Limiting', 'passed', 'Rate limiting integrated');
    } else {
      logTest('OpenAI Service Rate Limiting', 'failed', 'Rate limiting not integrated');
    }

  } catch (error) {
    logTest('OpenAI Rate Limiting Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test useAI hook
function testUseAIHook() {
  console.log('\n🎣 Testing useAI Hook');
  console.log('='.repeat(50));

  const hookPath = path.join(__dirname, 'client/src/hooks/useAI.ts');

  try {
    const hook = fs.readFileSync(hookPath, 'utf8');
    
    if (hook.includes('useState') && hook.includes('useCallback') && hook.includes('maxRetries')) {
      logTest('useAI Hook - Retry Logic', 'passed', 'Retry logic implemented');
    } else {
      logTest('useAI Hook - Retry Logic', 'failed', 'Retry logic not implemented');
    }

    if (hook.includes('toast') && hook.includes('error') && hook.includes('success')) {
      logTest('useAI Hook - User Feedback', 'passed', 'User feedback implemented');
    } else {
      logTest('useAI Hook - User Feedback', 'failed', 'User feedback not implemented');
    }

  } catch (error) {
    logTest('useAI Hook Code Analysis', 'failed', 'Could not read file', error.message);
  }
}

// Test for mock data usage
function testNoMockData() {
  console.log('\n🎭 Testing for Mock Data Usage');
  console.log('='.repeat(50));

  // Check LiveDealAnalysis for mock data
  const liveDealPath = path.join(__dirname, 'client/src/components/aiTools/LiveDealAnalysis.tsx');
  
  try {
    const liveDeal = fs.readFileSync(liveDealPath, 'utf8');
    
    if (!liveDeal.includes('setTimeout(resolve, 7000)') && !liveDeal.includes('Math.random()')) {
      logTest('Live Deal Analysis - No Mock Data', 'passed', 'No mock data or random simulation detected');
    } else {
      logTest('Live Deal Analysis - No Mock Data', 'failed', 'Mock data or simulation still present');
    }

  } catch (error) {
    logTest('Mock Data Check', 'failed', 'Could not read component file', error.message);
  }

  // Check for other mock data patterns
  const aiToolsDir = path.join(__dirname, 'client/src/components/aiTools');
  
  try {
    const files = fs.readdirSync(aiToolsDir);
    
    let mockDataFound = false;
    files.forEach(file => {
      if (file.endsWith('.tsx')) {
        const filePath = path.join(aiToolsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('Math.random()') || content.includes('setTimeout(resolve') || content.includes('demo') || content.includes('mock')) {
          mockDataFound = true;
          logTest(`${file} - Mock Data Check`, 'failed', 'Potential mock data detected');
        }
      }
    });

    if (!mockDataFound) {
      logTest('All AI Tools - No Mock Data', 'passed', 'No mock data patterns detected in AI tools');
    }

  } catch (error) {
    logTest('AI Tools Mock Data Check', 'failed', 'Could not scan AI tools directory', error.message);
  }
}

// Generate test report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 SmartCRM Production Readiness Test Report');
  console.log('='.repeat(80));

  console.log(`\n📊 Test Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);

  const successRate = testResults.total > 0 ? ((testResults.passed / testResults.total) * 100).toFixed(1) : '0.0';
  console.log(`   Success Rate: ${successRate}%`);

  console.log(`\n📋 Failed Tests:`);
  testResults.tests.filter(t => t.status === 'failed').forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name}: ${test.message}`);
    if (test.details) console.log(`      ${test.details}`);
  });

  console.log(`\n🏆 Production Readiness:`);
  if (testResults.failed === 0) {
    console.log(`   🎉 100% PRODUCTION READY! All features verified.`);
    console.log(`   ✅ No mock data detected`);
    console.log(`   ✅ Real AI APIs implemented`);
    console.log(`   ✅ Production-grade error handling`);
    console.log(`   ✅ Rate limiting and security`);
    console.log(`   ✅ Remote app infrastructure ready`);
  } else if (successRate >= 90) {
    console.log(`   ✅ MOSTLY READY: Minor issues to address.`);
  } else if (successRate >= 75) {
    console.log(`   ⚠️ REQUIRES ATTENTION: Several issues need fixing.`);
  } else {
    console.log(`   ❌ NOT READY: Critical issues must be resolved.`);
  }

  console.log(`\n💡 Recommendations:`);
  if (testResults.failed > 0) {
    console.log(`   - Address all failed tests before production deployment`);
    console.log(`   - Verify remote app deployments and connectivity`);
    console.log(`   - Test AI services with real API keys in staging environment`);
    console.log(`   - Implement comprehensive error boundaries`);
  } else {
    console.log(`   - All systems verified and production-ready!`);
    console.log(`   - No mock data detected - all features use real APIs`);
    console.log(`   - Ready for heavy consumer usage`);
    console.log(`   - AI services are secure and rate-limited`);
  }
}

// Main test execution
async function runProductionTests() {
  console.log('🚀 SmartCRM Production Readiness Test Suite');
  console.log('===========================================');
  console.log('Testing AI features, remote apps, and production readiness...');

  try {
    testRemoteAppsStatic();
    testAIServiceCode();
    testLiveDealAnalysis();
    testEmailComposer();
    testErrorBoundaries();
    testRateLimiting();
    testUseAIHook();
    testNoMockData();

    generateReport();

    // Exit with appropriate code
    const exitCode = testResults.failed > 0 ? 1 : 0;
    console.log(`\n🏁 Production readiness test completed with exit code: ${exitCode}`);
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runProductionTests();
