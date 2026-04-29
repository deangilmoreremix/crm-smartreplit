#!/usr/bin/env node

/**
 * Module Federation Remote Entry Verification Script
 * Checks if remoteEntry.js files are accessible for all MF apps
 */

const https = require('https');

const REMOTE_APPS = [
  { name: 'Pipeline', url: 'https://pipeline.smartcrm.vip/remoteEntry.js', scope: 'pipeline_app', module: './PipelineApp' },
  { name: 'Contacts', url: 'https://contacts.smartcrm.vip/remoteEntry.js', scope: 'contacts_app', module: './ContactsApp' },
  { name: 'Analytics', url: 'https://analytics.smartcrm.vip/assets/remoteEntry.js', scope: 'analytics_app', module: './AnalyticsApp' },
  { name: 'Agency', url: 'https://agency.smartcrm.vip/remoteEntry.js', scope: 'AIGoalsApp', module: './AIGoalsApp' },
];

function checkRemoteEntry(app) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Checking ${app.name}: ${app.url}`);

    const req = https.get(app.url, { timeout: 10000 }, (res) => {
      const statusCode = res.statusCode;

      if (statusCode === 200) {
        console.log(`  ✅ ${app.name} remoteEntry.js accessible (${statusCode})`);
        resolve({ name: app.name, ok: true });
      } else {
        console.log(`  ⚠️  ${app.name} returned status ${statusCode}`);
        resolve({ name: app.name, ok: false, status: statusCode });
      }
    });

    req.on('error', (error) => {
      console.log(`  ❌ ${app.name} failed: ${error.message}`);
      resolve({ name: app.name, ok: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`  ⏰ ${app.name} timed out`);
      req.destroy();
      resolve({ name: app.name, ok: false, error: 'timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Module Federation Remote Entry Verification\n');
  console.log('Testing all remote apps...');

  const results = await Promise.all(REMOTE_APPS.map(checkRemoteEntry));

  console.log('\n📊 Summary:');
  results.forEach((result) => {
    const icon = result.ok ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}${result.error ? ` (${result.error})` : ''}`);
  });

  const allOk = results.every((r) => r.ok);
  if (allOk) {
    console.log('\n🎉 All remote entries are accessible!');
  } else {
    console.log('\n⚠️  Some remote entries are not accessible. Actions needed:');
    console.log('  1. Ensure remote apps are built with Module Federation config');
    console.log('  2. Deploy built assets (including remoteEntry.js) to the correct URLs');
    console.log('  3. Verify CORS headers allow cross-origin access');
    console.log('  4. Check that the exposed module paths match the config');
  }

  process.exit(allOk ? 0 : 1);
}

main();
