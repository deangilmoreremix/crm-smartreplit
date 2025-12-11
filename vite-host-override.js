#!/usr/bin/env node
// Override script to inject custom Vite server configuration
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🔧 Applying Vite server configuration override...');

try {
  const serverVitePath = './server/vite.ts';
  let serverVite = readFileSync(serverVitePath, 'utf8');
  
  // Create backup
  writeFileSync(`${serverVitePath}.backup-override`, serverVite);
  
  // Check if custom config is already imported
  if (!serverVite.includes('custom-vite-config')) {
    // Add import at the top
    serverVite = serverVite.replace(
      'import viteConfig from "../vite.config";',
      `import viteConfig from "../vite.config";
import { customViteServerConfig } from "./custom-vite-config";`
    );
    
    // Modify the serverOptions to include our custom config
    serverVite = serverVite.replace(
      'const serverOptions = {',
      'const serverOptions = Object.assign({'
    );
    
    serverVite = serverVite.replace(
      'middlewareMode: true,\n    hmr: { server },\n  };',
      `middlewareMode: true,
    hmr: { server },
  }, customViteServerConfig);`
    );
    
    writeFileSync(serverVitePath, serverVite);
    console.log('✅ Server Vite configuration overridden successfully');
  } else {
    console.log('ℹ️  Custom configuration already applied');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  
  // If we can't modify server/vite.ts, try a different approach
  console.log('🔧 Attempting alternative fix via environment variables...');
  
  // Create a startup script that sets all necessary environment variables
  const startupScript = `#!/usr/bin/env node
import { spawn } from 'child_process';

// Set environment variables for Vite
process.env.VITE_ALLOWED_HOSTS = 'all';
process.env.DISABLE_HOST_CHECK = 'true';
process.env.HOST = '0.0.0.0';

// Start the actual server
const child = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    VITE_ALLOWED_HOSTS: 'all',
    DISABLE_HOST_CHECK: 'true',
    HOST: '0.0.0.0'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});`;

  writeFileSync('./server/start-with-hosts.js', startupScript);
  console.log('✅ Created alternative startup script: server/start-with-hosts.js');
}