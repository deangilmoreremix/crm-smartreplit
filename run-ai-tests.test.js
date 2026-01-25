#!/usr/bin/env node

/**
 * AI Production Readiness Test Runner
 * Executes comprehensive AI testing suite with reporting and CI/CD integration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AITestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      environment: this.getEnvironmentInfo(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      coverage: null,
      recommendations: []
    };
  }

  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      testUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      skipExpensive: process.env.SKIP_EXPENSIVE_TESTS === 'true'
    };
  }

  async runTests() {
    console.log('🚀 AI Production Readiness Test Runner');
    console.log('======================================\n');

    const startTime = Date.now();

    try {
      // Check if test server is running
      await this.checkServerHealth();

      // Run the comprehensive test suite
      const testResult = await this.executeTestSuite();

      // Generate coverage report if available
      await this.generateCoverageReport();

      // Analyze results and provide recommendations
      this.analyzeResults();

      // Generate final report
      this.generateReport();

      const duration = Date.now() - startTime;
      this.testResults.summary.duration = duration;

      console.log(`\n✅ Test execution completed in ${duration}ms`);
      console.log(`📊 Results: ${this.testResults.summary.passed}/${this.testResults.summary.total} tests passed`);

      return this.testResults.summary.failed === 0;

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      this.testResults.summary.error = error.message;
      return false;
    }
  }

  async checkServerHealth() {
    console.log('🔍 Checking server health...');

    try {
      const response = await fetch(`${process.env.TEST_BASE_URL || 'http://localhost:3000'}/api/health`, {
        timeout: 5000
      });

      if (response.ok) {
        console.log('✅ Server is healthy');
        return true;
      } else {
        console.log('⚠️  Server responded with status:', response.status);
        return false;
      }
    } catch (error) {
      console.log('⚠️  Server health check failed, proceeding anyway...');
      console.log('   Error:', error.message);
      return false;
    }
  }

  async executeTestSuite() {
    console.log('🧪 Executing AI test suite...');

    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', ['ai-production-readiness.test.js'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data);
      });

      testProcess.on('close', (code) => {
        this.testResults.exitCode = code;
        this.testResults.output = output;
        this.testResults.errorOutput = errorOutput;

        if (code === 0) {
          console.log('✅ Test suite completed successfully');
          resolve({ success: true, output, errorOutput });
        } else {
          console.log(`❌ Test suite failed with exit code ${code}`);
          resolve({ success: false, output, errorOutput, exitCode: code });
        }
      });

      testProcess.on('error', (error) => {
        console.error('❌ Failed to start test process:', error);
        reject(error);
      });
    });
  }

  async generateCoverageReport() {
    console.log('📊 Generating coverage report...');

    try {
      // Check if nyc or istanbul is available
      const hasCoverage = this.checkCoverageTool();

      if (hasCoverage) {
        // Run tests with coverage
        console.log('   Running tests with coverage...');
        execSync('nyc --reporter=lcov --reporter=text node ai-production-readiness.test.js', {
          stdio: 'inherit',
          timeout: 300000 // 5 minutes
        });

        // Read coverage report
        if (fs.existsSync('coverage/coverage-summary.json')) {
          const coverageData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
          this.testResults.coverage = coverageData;
          console.log('✅ Coverage report generated');
        }
      } else {
        console.log('⏭️  Coverage tool not available, skipping coverage report');
      }
    } catch (error) {
      console.log('⚠️  Coverage report generation failed:', error.message);
    }
  }

  checkCoverageTool() {
    try {
      execSync('which nyc', { stdio: 'ignore' });
      return true;
    } catch {
      try {
        execSync('which istanbul', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  }

  analyzeResults() {
    console.log('🔍 Analyzing test results...');

    const { summary } = this.testResults;

    // Parse test output to extract detailed results
    this.parseTestOutput();

    // Generate recommendations based on results
    this.generateRecommendations();
  }

  parseTestOutput() {
    // This would parse the detailed test output to extract individual test results
    // For now, we'll use the summary from the test suite
    const output = this.testResults.output || '';

    // Extract test counts from output (basic parsing)
    const passMatch = output.match(/Passed:\s*(\d+)/);
    const failMatch = output.match(/Failed:\s*(\d+)/);
    const skipMatch = output.match(/Skipped:\s*(\d+)/);
    const totalMatch = output.match(/Total Tests:\s*(\d+)/);

    if (passMatch) this.testResults.summary.passed = parseInt(passMatch[1]);
    if (failMatch) this.testResults.summary.failed = parseInt(failMatch[1]);
    if (skipMatch) this.testResults.summary.skipped = parseInt(skipMatch[1]);
    if (totalMatch) this.testResults.summary.total = parseInt(totalMatch[1]);
  }

  generateRecommendations() {
    const { summary } = this.testResults;

    if (summary.failed > 0) {
      this.testResults.recommendations.push({
        type: 'critical',
        message: `${summary.failed} tests failed. Review error logs and fix issues before production deployment.`,
        action: 'Fix failing tests and re-run test suite'
      });
    }

    if (summary.passed / summary.total < 0.8) {
      this.testResults.recommendations.push({
        type: 'warning',
        message: `Test success rate is below 80%. Current rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`,
        action: 'Improve test reliability and coverage'
      });
    }

    if (summary.skipped > summary.total * 0.3) {
      this.testResults.recommendations.push({
        type: 'info',
        message: `${summary.skipped} tests were skipped. Review skipped tests to ensure adequate coverage.`,
        action: 'Configure API keys or enable skipped test scenarios'
      });
    }

    // AI-specific recommendations
    if (this.testResults.output && this.testResults.output.includes('API key')) {
      this.testResults.recommendations.push({
        type: 'setup',
        message: 'AI API keys not configured. Configure OpenAI and Google AI API keys for full testing.',
        action: 'Set OPENAI_API_KEY and GOOGLE_AI_API_KEY environment variables'
      });
    }

    if (this.testResults.output && this.testResults.output.includes('rate limit')) {
      this.testResults.recommendations.push({
        type: 'performance',
        message: 'Rate limiting detected. Ensure production environment can handle expected load.',
        action: 'Review rate limiting configuration and scaling requirements'
      });
    }
  }

  generateReport() {
    const report = {
      ...this.testResults,
      generatedAt: new Date().toISOString(),
      success: this.testResults.summary.failed === 0
    };

    // Write JSON report
    const reportPath = `ai-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Write human-readable summary
    this.generateHumanReadableReport(report);

    // Write JUnit XML for CI/CD integration
    this.generateJUnitReport(report);
  }

  generateHumanReadableReport(report) {
    const summaryPath = `ai-test-summary-${Date.now()}.txt`;

    let content = '';
    content += 'AI Production Readiness Test Report\n';
    content += '='.repeat(40) + '\n\n';
    content += `Generated: ${report.generatedAt}\n`;
    content += `Environment: ${report.environment.platform} ${report.environment.arch}\n`;
    content += `Test URL: ${report.environment.testUrl}\n\n`;

    content += 'TEST RESULTS SUMMARY\n';
    content += '-'.repeat(20) + '\n';
    content += `Total Tests: ${report.summary.total}\n`;
    content += `Passed: ${report.summary.passed}\n`;
    content += `Failed: ${report.summary.failed}\n`;
    content += `Skipped: ${report.summary.skipped}\n`;
    content += `Duration: ${report.summary.duration}ms\n`;
    content += `Success Rate: ${report.summary.total > 0 ? ((report.summary.passed / report.summary.total) * 100).toFixed(1) : 0}%\n\n`;

    if (report.coverage) {
      content += 'CODE COVERAGE\n';
      content += '-'.repeat(13) + '\n';
      const total = report.coverage.total;
      content += `Statements: ${total.statements.pct}%\n`;
      content += `Branches: ${total.branches.pct}%\n`;
      content += `Functions: ${total.functions.pct}%\n`;
      content += `Lines: ${total.lines.pct}%\n\n`;
    }

    if (report.recommendations.length > 0) {
      content += 'RECOMMENDATIONS\n';
      content += '-'.repeat(15) + '\n';
      report.recommendations.forEach((rec, i) => {
        content += `${i + 1}. [${rec.type.toUpperCase()}] ${rec.message}\n`;
        content += `   Action: ${rec.action}\n\n`;
      });
    }

    content += `Overall Status: ${report.success ? '✅ PRODUCTION READY' : '❌ REQUIRES ATTENTION'}\n`;

    fs.writeFileSync(summaryPath, content);
    console.log(`📄 Human-readable summary saved to: ${summaryPath}`);
  }

  generateJUnitReport(report) {
    const junitPath = `ai-test-results-${Date.now()}.xml`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuites>\n';
    xml += `  <testsuite name="AI Production Readiness Tests" tests="${report.summary.total}" failures="${report.summary.failed}" skipped="${report.summary.skipped}" time="${report.summary.duration / 1000}">\n`;

    // Add individual test cases (simplified)
    for (let i = 0; i < report.summary.passed; i++) {
      xml += `    <testcase name="AI Test ${i + 1}" classname="AIProductionReadiness" time="0.001"/>\n`;
    }

    for (let i = 0; i < report.summary.failed; i++) {
      xml += `    <testcase name="AI Test Failed ${i + 1}" classname="AIProductionReadiness" time="0.001">\n`;
      xml += `      <failure message="Test failed">Test failure details not available in summary</failure>\n`;
      xml += '    </testcase>\n';
    }

    for (let i = 0; i < report.summary.skipped; i++) {
      xml += `    <testcase name="AI Test Skipped ${i + 1}" classname="AIProductionReadiness" time="0.001">\n`;
      xml += '      <skipped/>\n';
      xml += '    </testcase>\n';
    }

    xml += '  </testsuite>\n';
    xml += '</testsuites>\n';

    fs.writeFileSync(junitPath, xml);
    console.log(`📄 JUnit XML report saved to: ${junitPath}`);
  }

  // Utility method to clean up old reports
  cleanupOldReports() {
    try {
      const files = fs.readdirSync('.');
      const oldReports = files.filter(file =>
        file.startsWith('ai-test-report-') ||
        file.startsWith('ai-test-summary-') ||
        file.startsWith('ai-test-results-')
      );

      // Keep only last 10 reports
      if (oldReports.length > 10) {
        const toDelete = oldReports.sort().slice(0, -10);
        toDelete.forEach(file => {
          fs.unlinkSync(file);
          console.log(`🗑️  Cleaned up old report: ${file}`);
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// CLI interface
function printUsage() {
  console.log('AI Production Readiness Test Runner');
  console.log('');
  console.log('Usage:');
  console.log('  node run-ai-tests.test.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help          Show this help message');
  console.log('  --url <url>     Base URL for testing (default: http://localhost:3000)');
  console.log('  --verbose       Enable verbose output');
  console.log('  --skip-expensive Skip expensive tests (image generation, etc.)');
  console.log('  --cleanup       Clean up old test reports');
  console.log('');
  console.log('Environment Variables:');
  console.log('  TEST_BASE_URL              Base URL for testing');
  console.log('  VERBOSE                    Enable verbose output');
  console.log('  SKIP_EXPENSIVE_TESTS       Skip expensive tests');
  console.log('  OPENAI_API_KEY            OpenAI API key for testing');
  console.log('  GOOGLE_AI_API_KEY         Google AI API key for testing');
  console.log('');
  console.log('Examples:');
  console.log('  node run-ai-tests.test.js');
  console.log('  node run-ai-tests.test.js --url https://my-app.com --verbose');
  console.log('  TEST_BASE_URL=https://staging.example.com node run-ai-tests.test.js');
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
        printUsage();
        process.exit(0);
        break;

      case '--url':
        if (i + 1 < args.length) {
          options.url = args[i + 1];
          i++;
        }
        break;

      case '--verbose':
        options.verbose = true;
        break;

      case '--skip-expensive':
        options.skipExpensive = true;
        break;

      case '--cleanup':
        options.cleanup = true;
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();

  // Set environment variables from options
  if (options.url) {
    process.env.TEST_BASE_URL = options.url;
  }

  if (options.verbose) {
    process.env.VERBOSE = 'true';
  }

  if (options.skipExpensive) {
    process.env.SKIP_EXPENSIVE_TESTS = 'true';
  }

  if (options.cleanup) {
    const runner = new AITestRunner();
    runner.cleanupOldReports();
    console.log('🧹 Old reports cleaned up');
    return;
  }

  const runner = new AITestRunner();
  const success = await runner.runTests();

  process.exit(success ? 0 : 1);
}

// Export for programmatic use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AITestRunner;
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(error => {
    console.error('Test runner execution failed:', error);
    process.exit(1);
  });
}