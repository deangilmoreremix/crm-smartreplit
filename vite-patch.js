// Runtime patch for Vite allowedHosts configuration
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

try {
  console.log('🔧 Patching Vite configuration for allowedHosts...');

  const viteConfigPath = './vite.config.ts';
  let viteConfig = readFileSync(viteConfigPath, 'utf8');

  // Create a backup
  writeFileSync(`${viteConfigPath}.backup`, viteConfig);

  // Patch the allowedHosts configuration
  const patchedConfig = viteConfig.replace(
    /allowedHosts:\s*(?:\[\s*[^}]+\]|"all")/gm,
    'allowedHosts: true'
  );

  if (patchedConfig !== viteConfig) {
    writeFileSync(viteConfigPath, patchedConfig);
    console.log('✅ Vite configuration patched successfully');
  } else {
    console.log('❌ Failed to patch Vite configuration');
  }
} catch (error) {
  console.error('❌ Error patching Vite configuration:', error.message);
}
