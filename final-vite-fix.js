#!/usr/bin/env node
// Final fix for Vite allowedHosts - adding specific host

import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Applying final Vite allowedHosts fix...');

try {
  const viteConfigPath = './vite.config.ts';
  let viteConfig = readFileSync(viteConfigPath, 'utf8');
  
  // Create backup
  writeFileSync(`${viteConfigPath}.backup-final`, viteConfig);
  
  // Add the specific problematic host and wildcard patterns
  const specificHost = '9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev';
  
  // Replace the allowedHosts array with one that includes the specific host
  viteConfig = viteConfig.replace(
    /allowedHosts:\s*\[[^\]]*\]/,
    `allowedHosts: [
      "${specificHost}",
      ".replit.dev",
      ".repl.co", 
      ".riker.replit.dev",
      "*.riker.replit.dev",
      "localhost",
      "0.0.0.0"
    ]`
  );
  
  writeFileSync(viteConfigPath, viteConfig);
  console.log('✅ Added specific host:', specificHost);
  console.log('✅ Vite configuration updated with comprehensive host list');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}