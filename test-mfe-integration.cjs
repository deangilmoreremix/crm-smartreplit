#!/usr/bin/env node

/**
 * Module Federation Integration Test Script
 * Tests remote app loading and federation functionality
 */

const https = require('https');

const REMOTES = {
  pipeline: 'https://cheery-syrniki-b5b6ca.netlify.app/assets/remoteEntry.js',
  contacts: 'https://taupe-sprinkles-83c9ee.netlify.app/assets/remoteEntry.js',
  analytics: 'https://ai-analytics.smartcrm.vip/assets/remoteEntry.js',
  calendar: 'https://calendar.smartcrm.vip/assets/remoteEntry.js'
};

function testRemoteEntry(url, name) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing ${name} remote entry: ${url}`);

    const request = https.get(url, { timeout: 10000 }, (res) => {
      const statusCode = res.statusCode;
      const hasCorsHeaders = res.headers['access-control-allow-origin'] === '*' ||
                           res.headers['access-control-allow-origin'];

      console.log(`   Status: ${statusCode}`);
      console.log(`   CORS: ${hasCorsHeaders ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${res.headers['content-type'] || 'unknown'}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const isValidJS = data.includes('System.register') ||
                         data.includes('define(') ||
                         data.includes('export') ||
                         data.includes('import(');
        console.log(`   Valid JS Module: ${isValidJS ? '✅' : '❌'}`);
        console.log(`   Size: ${data.length} bytes`);

        resolve({
          name,
          url,
          success: statusCode === 200 && hasCorsHeaders && isValidJS,
          statusCode,
          hasCorsHeaders,
          isValidJS,
          size: data.length
        });
      });
    });

    request.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve({
        name,
        url,
        success: false,
        error: err.message
      });
    });

    request.on('timeout', () => {
      console.log(`   ❌ Timeout after 10 seconds`);
      request.destroy();
      resolve({
        name,
        url,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function runTests() {
  console.log('🚀 Module Federation Integration Test Suite\n');
  console.log('=' .repeat(50));

  const results = [];

  for (const [name, url] of Object.entries(REMOTES)) {
    const result = await testRemoteEntry(url, name);
    results.push(result);
    console.log(''); // Add spacing between tests
  }

  // Summary
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(30));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Working remotes: ${successful.length}/${results.length}`);
  console.log(`❌ Failed remotes: ${failed.length}/${results.length}`);

  successful.forEach(r => {
    console.log(`   ✅ ${r.name}: ${r.statusCode}, ${r.size} bytes`);
  });

  failed.forEach(r => {
    console.log(`   ❌ ${r.name}: ${r.error || 'Unknown error'}`);
  });

  console.log('\n🎯 Next Steps:');
  if (failed.length === 0) {
    console.log('   ✅ All remotes are accessible and properly configured!');
    console.log('   ✅ MFE should work in the browser');
    console.log('   📝 Test in browser: navigate to /pipeline, /contacts, /analytics, /calendar');
  } else {
    console.log('   ⚠️  Some remotes failed - check deployment status');
    console.log('   🔧 Redeploy failed apps or update URLs in configuration');
  }

  return results;
}

// Run the tests
runTests().catch(console.error);