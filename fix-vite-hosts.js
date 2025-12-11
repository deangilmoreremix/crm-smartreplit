#!/usr/bin/env node
// Fix for Vite allowedHosts blocking issue on Replit

import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Fixing Vite allowedHosts configuration...');

try {
  // First, ensure vite.config.ts has correct allowedHosts setting
  const viteConfigPath = './vite.config.ts';
  let viteConfig = readFileSync(viteConfigPath, 'utf8');
  
  // Create backup
  writeFileSync(`${viteConfigPath}.backup`, viteConfig);
  
  // Fix allowedHosts - handle various formats
  if (viteConfig.includes('allowedHosts')) {
    // Replace any existing allowedHosts configuration with 'all'
    viteConfig = viteConfig.replace(
      /allowedHosts:\s*(?:true|\[\s*[^\]]*\]|"[^"]*")/g,
      'allowedHosts: [".replit.dev", ".repl.co", ".riker.replit.dev", "localhost", "0.0.0.0"]'
    );
  } else {
    // Add allowedHosts if it doesn't exist
    viteConfig = viteConfig.replace(
      /server:\s*{/,
      'server: {\n    allowedHosts: [".replit.dev", ".repl.co", ".riker.replit.dev", "localhost", "0.0.0.0"],'
    );
  }
  
  writeFileSync(viteConfigPath, viteConfig);
  console.log('✅ Vite configuration fixed with comprehensive allowedHosts');
  
  // Set environment variables as backup
  process.env.VITE_ALLOWED_HOSTS = 'all';
  process.env.DISABLE_HOST_CHECK = 'true';
  
  console.log('✅ Environment variables set');
  console.log('📦 Please restart your application for changes to take effect');
  
} catch (error) {
  console.error('❌ Error fixing Vite configuration:', error.message);
  process.exit(1);
}