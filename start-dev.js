#!/usr/bin/env node

// Custom startup script to override Vite allowedHosts configuration
process.env.VITE_DEV_SERVER_ALLOWED_HOSTS = 'all';
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';
process.env.DISABLE_HOST_CHECK = 'true';
process.env.HOST = '0.0.0.0';

// Dynamic import and patch Vite config
import { spawn } from 'child_process';

const child = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_ALLOWED_HOSTS: 'all',
    DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
    DISABLE_HOST_CHECK: 'true',
    HOST: '0.0.0.0'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});