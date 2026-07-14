#!/usr/bin/env node
/**
 * kill-dev-ports.js
 * SmartCRM Dev Port Manager
 *
 * Usage:
 *   node scripts/kill-dev-ports.js          → Kill conflicting processes + clean PID files
 *   node scripts/kill-dev-ports.js --debug  → Only show what would be killed (no changes)
 *   node scripts/kill-dev-ports.js --clean-pids-only → Only remove stale PID files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTS = [5000, 5173, 5174, 5175, 5176, 3000, 8080, 4173];
const PID_FILES = ['server.pid', 'smartcrm.pid', '.vite-port', 'vite.pid'];

const isDebug = process.argv.includes('--debug');
const cleanPidsOnly = process.argv.includes('--clean-pids-only');

console.log('\n🔧 SmartCRM Dev Environment Manager');
console.log('=====================================');

if (isDebug) {
  console.log('🔍 DEBUG MODE — No processes will be killed\n');
}

// === PID File Cleanup ===
console.log('🗑️  Cleaning stale PID files...');
let pidsCleaned = 0;

for (const pidFile of PID_FILES) {
  const fullPath = path.resolve(pidFile);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8').trim();
      console.log(`   Found ${pidFile} (PID: ${content || 'unknown'})`);
      if (!isDebug) {
        fs.unlinkSync(fullPath);
        console.log(`   ✅ Removed ${pidFile}`);
      } else {
        console.log(`   (would remove in non-debug mode)`);
      }
      pidsCleaned++;
    } catch (e) {
      console.log(`   ⚠️  Could not process ${pidFile}`);
    }
  }
}

if (pidsCleaned === 0) {
  console.log('   ✓ No stale PID files found.');
}

if (cleanPidsOnly) {
  console.log('\n✅ PID cleanup complete.\n');
  process.exit(0);
}

// === Port Scanning & Killing ===
console.log('\n🌐 Scanning ports:', PORTS.join(', '));

let found = 0;
let killed = 0;

for (const port of PORTS) {
  try {
    const output = execSync(`lsof -i :${port} -sTCP:LISTEN -P 2>/dev/null || true`, { encoding: 'utf8' }).trim();

    if (!output) continue;

    const lines = output.split('\n');
    for (let i = 1; i < lines.length; i++) { // skip header
      const line = lines[i];
      if (!line) continue;

      const parts = line.trim().split(/\s+/);
      const pid = parts[1];
      const command = parts[0];

      if (pid && !isNaN(parseInt(pid))) {
        found++;
        console.log(`   Port ${port}: PID ${pid} (${command})`);

        if (!isDebug) {
          try {
            process.kill(parseInt(pid, 10), 'SIGKILL');
            console.log(`     ✅ Killed`);
            killed++;
          } catch (killErr) {
            console.log(`     ⚠️  Already gone or permission issue`);
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

if (found === 0) {
  console.log('   ✓ No processes found on dev ports.');
} else if (!isDebug) {
  console.log(`\n✅ Killed ${killed} process(es).`);
} else {
  console.log(`\nℹ️  Found ${found} process(es) — would have killed them without --debug.`);
}

// Final status
console.log('\n=====================================');
if (isDebug) {
  console.log('🔍 Debug scan complete. Run without --debug to clean.');
} else {
  console.log('✅ Environment cleaned and ready.');
  console.log('   Next: npm run dev  (or npm run dev:clean)');
}
console.log('');
