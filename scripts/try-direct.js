import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const sql = readFileSync('./supabase-seed.sql', 'utf-8');

// Write a standalone node script that uses direct HTTPS
const runnerCode = `
const https = require('https');
const { parse } = require('url');

const projectId = 'bzxohkrxcwodllketcpz';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = \`${sql.replace(/`/g, '\\`')}\`;

const postData = JSON.stringify({ sql });

const options = {
  hostname: 'bzxohkrxcwodllketcpz.supabase.co',
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
`;

writeFileSync('./scripts/execute-sql.js', runnerCode);
console.log('✅ Direct executor created. Now attempting to run SQL via HTTPS...');

try {
  execSync('node scripts/execute-sql.js', { stdio: 'inherit' });
} catch (e) {
  console.log('\n⚠️  Direct HTTPS execution failed.');
  console.log('Please run the SQL manually in Supabase SQL Editor.\n');
}
