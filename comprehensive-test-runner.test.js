#!/usr/bin/env node

/**
 * SmartCRM Comprehensive Test Runner
 * Runs all test suites and provides unified reporting
 * Run with: node comprehensive-test-runner.test.js
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test suites configuration
const testSuites = [
  {
    name: 'API Health Tests',
    file: 'test-api-health.test.js',
    description: 'Tests all APIs, Supabase connection, and service availability'
  },
  {
    name: 'Supabase Edge Functions Tests',
    file: 'supabase-edge-functions.test.js',
    description: 'Tests all Supabase edge functions with authentication'
  },
  {
    name: 'Fallback Mechanisms Tests',
    file: 'fallback-mechanisms.test.js',
    description: 'Tests all fallback scenarios when services fail'
  },
  {
    name: 'Health Monitor Tests',
    file: 'health-monitor.test.js',
    description: 'Tests the health monitoring system'
  }
];

// Test results aggregator
let overallResults = {
  suites: [],
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  totalWarnings: 0,
  startTime: null,
  endTime: null,
  duration: 0
};

// Helper function to run a test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n🚀 Running: ${suite.name}`);
    console.log(`Description: ${suite.description}`);
    console.log('='.repeat(60));

    const testProcess = spawn('node', [suite.file], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    let suiteResult = {
      name: suite.name,
      file: suite.file,
      exitCode: null,
      duration: 0,
      startTime: Date.now()
    };

    testProcess.on('close', (code) => {
      suiteResult.exitCode = code;
      suiteResult.duration = Date.now() - suiteResult.startTime;

      console.log(`\n📊 ${suite.name} completed with exit code: ${code}`);
      console.log(`Duration: ${(suiteResult.duration / 1000).toFixed(2)}s`);

      overallResults.suites.push(suiteResult);
      resolve(suiteResult);
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Failed to run ${suite.name}:`, error.message);
      suiteResult.exitCode = 1;
      suiteResult.duration = Date.now() - suiteResult.startTime;
      overallResults.suites.push(suiteResult);
      resolve(suiteResult);
    });
  });
}

// Function to check if test files exist
function checkTestFiles() {
  const missingFiles = [];

  testSuites.forEach(suite => {
    try {
      // Use fs.accessSync to check if file exists
      fs.accessSync(path.join(__dirname, suite.file), fs.constants.F_OK);
    } catch (error) {
      missingFiles.push(suite.file);
    }
  });

  if (missingFiles.length > 0) {
    console.log('❌ Missing test files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n💡 Run the following commands to create missing test files:');
    console.log('   node test-api-health.test.js');
    console.log('   node supabase-edge-functions.test.js');
    console.log('   node fallback-mechanisms.test.js');
    console.log('   node health-monitor.test.js check');
    return false;
  }

  return true;
}

// Function to generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 SmartCRM Comprehensive Test Report');
  console.log('='.repeat(80));

  console.log(`\n⏱️  Test Execution Summary:`);
  console.log(`   Start Time: ${new Date(overallResults.startTime).toISOString()}`);
  console.log(`   End Time: ${new Date(overallResults.endTime).toISOString()}`);
  console.log(`   Total Duration: ${(overallResults.duration / 1000).toFixed(2)}s`);

  console.log(`\n📊 Overall Results:`);
  console.log(`   Test Suites: ${overallResults.suites.length}`);
  console.log(`   ✅ Passed: ${overallResults.totalPassed}`);
  console.log(`   ❌ Failed: ${overallResults.totalFailed}`);
  console.log(`   ⚠️  Warnings: ${overallResults.totalWarnings}`);

  const successRate = overallResults.totalTests > 0
    ? ((overallResults.totalPassed / overallResults.totalTests) * 100).toFixed(1)
    : '0.0';
  console.log(`   Success Rate: ${successRate}%`);

  console.log(`\n📋 Suite Details:`);
  overallResults.suites.forEach((suite, index) => {
    const icon = suite.exitCode === 0 ? '✅' : '❌';
    const duration = (suite.duration / 1000).toFixed(2);
    console.log(`   ${index + 1}. ${icon} ${suite.name}`);
    console.log(`      File: ${suite.file}`);
    console.log(`      Exit Code: ${suite.exitCode}`);
    console.log(`      Duration: ${duration}s`);
  });

  console.log(`\n🏆 Final Status:`);
  if (overallResults.totalFailed === 0) {
    console.log(`   🎉 ALL TESTS PASSED! SmartCRM is fully operational.`);
  } else if (overallResults.totalPassed > overallResults.totalFailed) {
    console.log(`   ⚠️  MOSTLY HEALTHY: Some tests failed but core functionality works.`);
  } else {
    console.log(`   ❌ CRITICAL ISSUES: Many tests failed. Immediate attention required.`);
  }

  console.log(`\n💡 Recommendations:`);
  if (overallResults.totalFailed > 0) {
    console.log(`   - Review failed test suites for specific issues`);
    console.log(`   - Check API key configurations`);
    console.log(`   - Verify Supabase connection and edge functions`);
    console.log(`   - Test fallback mechanisms manually`);
  }

  if (overallResults.totalWarnings > 0) {
    console.log(`   - Address warning conditions`);
    console.log(`   - Consider configuring additional AI providers`);
    console.log(`   - Review monitoring and alerting setup`);
  }

  if (overallResults.totalFailed === 0 && overallResults.totalWarnings === 0) {
    console.log(`   - All systems operational!`);
    console.log(`   - Consider setting up automated monitoring`);
    console.log(`   - Ready for production deployment`);
  }
}

// Function to run environment checks
function runEnvironmentChecks() {
  console.log('🔍 Environment Checks:');
  console.log('='.repeat(40));

  const checks = [
    {
      name: 'Node.js Version',
      check: () => {
        const version = process.version;
        const isValid = parseInt(version.split('.')[0].slice(1)) >= 18;
        return { passed: isValid, message: `Node.js ${version} ${isValid ? '(✅ Supported)' : '(❌ Requires v18+)'}` };
      }
    },
    {
      name: 'BASE_URL',
      check: () => {
        const url = process.env.BASE_URL;
        return {
          passed: !!url,
          message: url ? `${url} (✅ Configured)` : 'Not set (⚠️ Using default)'
        };
      }
    },
    {
      name: 'SUPABASE_URL',
      check: () => {
        const url = process.env.SUPABASE_URL;
        return {
          passed: !!url,
          message: url ? 'Configured (✅)' : 'Not set (❌ Required for edge functions)'
        };
      }
    },
    {
      name: 'SUPABASE_ANON_KEY',
      check: () => {
        const key = process.env.SUPABASE_ANON_KEY;
        return {
          passed: !!key,
          message: key ? 'Configured (✅)' : 'Not set (❌ Required for edge functions)'
        };
      }
    },
    {
      name: 'OpenAI API Key',
      check: () => {
        const key = process.env.OPENAI_API_KEY;
        return {
          passed: !!key,
          message: key ? 'Configured (✅)' : 'Not set (⚠️ Limited AI functionality)'
        };
      }
    },
    {
      name: 'Google AI API Key',
      check: () => {
        const key = process.env.GOOGLE_AI_API_KEY;
        return {
          passed: !!key,
          message: key ? 'Configured (✅)' : 'Not set (⚠️ Limited AI functionality)'
        };
      }
    }
  ];

  checks.forEach(check => {
    const result = check.check();
    console.log(`   ${result.passed ? '✅' : result.passed === false ? '❌' : '⚠️'} ${check.name}: ${result.message}`);
  });

  console.log('');
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 SmartCRM Comprehensive Test Suite');
  console.log('=====================================');

  overallResults.startTime = Date.now();

  // Run environment checks
  runEnvironmentChecks();

  // Check if test files exist
  if (!checkTestFiles()) {
    console.log('\n❌ Cannot run tests due to missing files.');
    process.exit(1);
  }

  console.log('🎯 Running Test Suites:');
  console.log('='.repeat(40));

  // Run all test suites sequentially
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }

  overallResults.endTime = Date.now();
  overallResults.duration = overallResults.endTime - overallResults.startTime;

  // Calculate totals from suite results
  overallResults.totalTests = overallResults.suites.length;
  overallResults.totalPassed = overallResults.suites.filter(s => s.exitCode === 0).length;
  overallResults.totalFailed = overallResults.suites.filter(s => s.exitCode !== 0).length;

  // Generate comprehensive report
  generateReport();

  // Exit with appropriate code
  const exitCode = overallResults.totalFailed > 0 ? 1 : 0;
  console.log(`\n🏁 Test suite completed with exit code: ${exitCode}`);
  process.exit(exitCode);
}

// CLI interface
function showUsage() {
  console.log('SmartCRM Comprehensive Test Runner');
  console.log('===================================');
  console.log('');
  console.log('Usage:');
  console.log('  node comprehensive-test-runner.test.js    # Run all tests');
  console.log('  node comprehensive-test-runner.test.js --help  # Show this help');
  console.log('');
  console.log('Test Suites:');
  testSuites.forEach((suite, index) => {
    console.log(`  ${index + 1}. ${suite.name}`);
    console.log(`     File: ${suite.file}`);
    console.log(`     Description: ${suite.description}`);
    console.log('');
  });
  console.log('Environment Variables:');
  console.log('  BASE_URL              # SmartCRM base URL (default: http://localhost:5000)');
  console.log('  SUPABASE_URL          # Supabase project URL');
  console.log('  SUPABASE_ANON_KEY     # Supabase anonymous key');
  console.log('  OPENAI_API_KEY        # OpenAI API key');
  console.log('  GOOGLE_AI_API_KEY     # Google AI API key');
  console.log('');
  console.log('Exit Codes:');
  console.log('  0 = All tests passed');
  console.log('  1 = Some tests failed');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2];

  if (arg === '--help' || arg === '-h') {
    showUsage();
  } else {
    runComprehensiveTests().catch(error => {
      console.error('❌ Comprehensive test suite failed:', error);
      process.exit(1);
    });
  }
}

export {
  runComprehensiveTests,
  testSuites,
  overallResults
};