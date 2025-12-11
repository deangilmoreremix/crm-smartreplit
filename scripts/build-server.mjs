import { build } from 'esbuild';
import { cpSync } from 'fs';

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  packages: 'external'
});

// Copy static files to dist/public for production
cpSync('server/public', 'dist/public', { recursive: true });

console.log('✅ Server built to dist/index.js');
console.log('✅ Static files copied to dist/public');
