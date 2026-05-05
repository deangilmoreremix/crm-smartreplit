#!/usr/bin/env node
import { exec } from 'child_process';
import { createServer } from 'http';

// Simple health check server first
const healthServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

healthServer.listen(5001, () => {
  console.log('✅ Health check server running on port 5001');
});

// Now start the actual SmartCRM server
console.log('Starting SmartCRM server...');
const child = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
  if (stderr) {
    console.error('Server stderr:', stderr);
  }
  console.log('Server stdout:', stdout);
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  child.kill();
  process.exit();
});