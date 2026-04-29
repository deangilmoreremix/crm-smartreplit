#!/usr/bin/env node

/**
 * Module Federation Integration Test Script
 * Tests MFE routes after deployment to verify correct integration
 * 
 * Usage: node test-mfe-integration.js [BASE_URL]
 * Example: node test-mfe-integration.js https://app.smartcrm.vip
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const BASE_URL = process.argv[2] || 'https://app.smartcrm.vip';

// MFE routes to test
const MFE_ROUTES = [
  { path: '/contacts', name: 'Contacts MFE', type: 'mfe', expects: 'module' },
  { path: '/pipeline', name: 'Pipeline MFE', type: 'mfe', expects: 'module' },
  { path: '/calendar', name: 'Calendar MFE', type: 'mfe', expects: 'module' },
  { path: '/ai-goals', name: 'AI Goals (Coming Soon)', type: 'placeholder', expects: 'coming-soon' },
  { path: '/analytics-remote', name: 'Analytics Iframe', type: 'iframe', expects: 'iframe' },
];

// RemoteEntry.js URLs to test
const REMOTE_ENTRIES = [
  { name: 'Contacts', url: 'https://contacts.smartcrm.vip/assets/remoteEntry.js' },
  { name: 'Pipeline', url: 'https://pipeline.smartcrm.vip/assets/remoteEntry.js' },
  { name: 'Calendar', url: 'https://calendar.smartcrm.vip/assets/remoteEntry.js' },
  { name: 'Agency (AI Goals)', url: 'https://agency.smartcrm.vip/assets/remoteEntry.js' },
  { name: 'Analytics', url: 'https://ai-analytics.smartcrm.vip/assets/remoteEntry.js' },
];

// Iframe URLs (for routes NOT tested, informational only)
const IFRAME_URLS = [
  { name: 'FunnelCraft AI', url: 'https://landing.smartcrm.vip/' },
  { name: 'SmartCRM Closer', url: 'https://agency.smartcrm.vip/' },
];

// Test state
const results = {
  baseUrl: BASE_URL,
  timestamp: new Date().toISOString(),
  routes: [],
  remoteEntries: [],
  iframes: [],
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper to make HTTP/HTTPS requests
function fetchURL(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHTTPS = url.protocol === 'https:';
    const lib = isHTTPS ? https : http;
    
    const request = lib.get({
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'SmartCRM-MFE-Tester/1.0'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });
  });
}

// Test a single page route
async function testRoute(route) {
  const result = {
    route: route.path,
    name: route.name,
    url: `${BASE_URL}${route.path}`,
    status: 'unknown',
    statusCode: 0,
    checks: [],
    errors: [],
    warnings: []
  };
  
  try {
    const response = await fetchURL(result.url);
    result.statusCode = response.statusCode;
    
    // Check 1: Status code 200
    if (response.statusCode === 200) {
      result.checks.push('✅ Status 200 OK');
    } else {
      result.errors.push(`❌ Expected 200, got ${response.statusCode}`);
      result.status = 'failed';
      results.summary.failed++;
      return result;
    }
    
    // Check page content for fallback messages
    const body = response.body.toLowerCase();
    
    if (body.includes('module unavailable') || 
        body.includes('module federation is disabled')) {
      result.errors.push('❌ Page shows "Module Unavailable" fallback');
      result.status = 'failed';
      results.summary.failed++;
    } else {
      result.checks.push('✅ No "Module Unavailable" fallback detected');
    }
    
    // Check for placeholder content (ai-goals)
    if (route.type === 'placeholder') {
      if (body.includes('coming soon') || body.includes('under development')) {
        result.checks.push('✅ Shows "Coming Soon" placeholder as expected');
      } else {
        result.warnings.push('⚠️ Expected "Coming Soon" message not found');
        results.summary.warnings++;
      }
    }
    
    // Check for iframe (analytics-remote)
    if (route.type === 'iframe') {
      if (response.body.includes('<iframe') && body.includes('ai-analytics')) {
        result.checks.push('✅ Contains iframe element');
      } else {
        result.errors.push('❌ Expected iframe not found');
        result.status = 'failed';
        results.summary.failed++;
      }
    }
    
    // Check page title
    const titleMatch = response.body.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1];
      result.pageTitle = title;
      if (title.toLowerCase().includes(route.name.toLowerCase().split(' ')[0])) {
        result.checks.push(`✅ Page title: "${title}"`);
      } else {
        result.warnings.push(`⚠️ Page title may be incorrect: "${title}"`);
        results.summary.warnings++;
      }
    }
    
    if (result.status !== 'failed') {
      result.status = 'passed';
      results.summary.passed++;
    }
    
  } catch (err) {
    result.errors.push(`❌ Request failed: ${err.message}`);
    result.status = 'failed';
    results.summary.failed++;
  }
  
  return result;
}

// Test remoteEntry.js accessibility
async function testRemoteEntry(remote) {
  const result = {
    name: remote.name,
    url: remote.url,
    status: 'unknown',
    statusCode: 0,
    checks: [],
    errors: [],
    corsHeaders: {}
  };
  
  try {
    const response = await fetchURL(remote.url);
    result.statusCode = response.statusCode;
    
    if (response.statusCode === 200) {
      result.checks.push('✅ remoteEntry.js accessible (200)');
    } else {
      result.errors.push(`❌ Expected 200, got ${response.statusCode}`);
      result.status = 'failed';
      results.summary.failed++;
      return result;
    }
    
    // Check CORS headers
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    let hasCORS = false;
    for (const header of corsHeaders) {
      if (response.headers[header]) {
        hasCORS = true;
        result.corsHeaders[header] = response.headers[header];
        result.checks.push(`✅ ${header}: ${response.headers[header]}`);
      }
    }
    
    if (!hasCORS) {
      result.warnings.push('⚠️ No CORS headers found (may cause issues)');
      results.summary.warnings++;
    }
    
    // Check content type
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('javascript')) {
      result.checks.push('✅ Content-Type is JavaScript');
    }
    
    // Quick check if it looks like a Module Federation remoteEntry
    if (response.body.includes('__webpack_init_sharing__') || 
        response.body.includes('webpack') ||
        response.body.includes('init')) {
      result.checks.push('✅ Appears to be valid Module Federation remoteEntry');
    }
    
    result.status = 'passed';
    results.summary.passed++;
    
  } catch (err) {
    result.errors.push(`❌ Request failed: ${err.message}`);
    result.status = 'error';
    results.summary.failed++;
  }
  
  return result;
}

// Test iframe URLs (informational)
async function testIframe(url) {
  const result = {
    name: url.name,
    url: url.url,
    status: 'unknown',
    statusCode: 0,
    checks: [],
    errors: []
  };
  
  try {
    const response = await fetchURL(url.url);
    result.statusCode = response.statusCode;
    
    if (response.statusCode === 200) {
      result.checks.push('✅ Iframe target accessible (200)');
      result.status = 'passed';
      results.summary.passed++;
    } else {
      result.errors.push(`❌ Expected 200, got ${response.statusCode}`);
      result.status = 'failed';
      results.summary.failed++;
    }
    
  } catch (err) {
    result.errors.push(`❌ Request failed: ${err.message}`);
    result.status = 'error';
    results.summary.failed++;
  }
  
  return result;
}

// Print helper
function printResult(result) {
  result.checks.forEach(c => console.log(`  ${c}`));
  if (result.warnings) result.warnings.forEach(w => console.log(`  ${w}`));
  result.errors.forEach(e => console.log(`  ${e}`));
  console.log(`  Status: ${result.status.toUpperCase()}`);
}

// Main execution
async function main() {
  console.log('\n🔍 Module Federation Integration Test\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  console.log('━'.repeat(60));
  console.log('📋 Testing Routes');
  console.log('━'.repeat(60));
  
  for (const route of MFE_ROUTES) {
    console.log(`\nTesting: ${route.name} (${route.path})`);
    const result = await testRoute(route);
    results.routes.push(result);
    printResult(result);
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('📦 Testing RemoteEntry.js Files');
  console.log('━'.repeat(60));
  
  for (const remote of REMOTE_ENTRIES) {
    console.log(`\nTesting: ${remote.name}`);
    const result = await testRemoteEntry(remote);
    results.remoteEntries.push(result);
    printResult(result);
    if (Object.keys(result.corsHeaders).length > 0) {
      console.log(`  CORS: Present`);
    } else {
      console.log(`  CORS: Missing`);
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('🖼️  Testing Excluded Iframes (Optional)');
  console.log('━'.repeat(60));
  
  for (const iframe of IFRAME_URLS) {
    console.log(`\nTesting: ${iframe.name}`);
    const result = await testIframe(iframe);
    results.iframes.push(result);
    printResult(result);
  }
  
  // Generate report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST REPORT');
  console.log('═'.repeat(60));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Total: ${results.summary.passed + results.summary.failed} tests`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  
  // Failed items
  const failedRoutes = results.routes.filter(r => r.status === 'failed');
  const failedRemotes = results.remoteEntries.filter(r => r.status === 'failed');
  
  if (failedRoutes.length > 0 || failedRemotes.length > 0) {
    console.log('\n🔴 FAILED ITEMS:');
    failedRoutes.forEach(r => console.log(`  • ${r.name} (${r.route}): ${r.errors.join(', ')}`));
    failedRemotes.forEach(r => console.log(`  • ${r.name} remoteEntry: ${r.errors.join(', ')}`));
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (failedRoutes.length === 0 && failedRemotes.length === 0) {
    console.log('  ✅ All critical tests passed!');
    console.log('  ℹ️  Ensure NODE_ENV=production in deployment for full MFE functionality');
    console.log('  ℹ️  Verify VITE_ENABLE_MFE=true is set in production environment');
  } else {
    console.log('  • Verify that all MFE apps are deployed and accessible');
    console.log('  • Check that remoteEntry.js files are at the correct paths');
    console.log('  • Ensure CORS headers are properly configured on remote servers');
    console.log('  • Confirm VITE_ENABLE_MFE=true is set in production environment');
    console.log('  • Check NODE_ENV=production (MFEs only load in production mode per vite.config.ts:15)');
  }
  
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run
main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
