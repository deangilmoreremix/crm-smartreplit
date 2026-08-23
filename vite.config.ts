import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "client",                // tell Vite where index.html is
  plugins: [
    react(),
    // NOTE: The @module-federation/vite `federation()` plugin was removed from the
    // HOST. The host is a pure *consumer* — it loads remotes at runtime via
    // client/src/utils/dynamicModuleFederation.ts (useRemoteComponent), which calls
    // `import(remoteEntryUrl)` with @vite-ignore and passes shared deps
    // (react/react-dom/react-router-dom) into container.init() manually. No static
    // `import('ContactsApp/...')` exists anywhere in the client, so the plugin is
    // unnecessary. Keeping it caused `vite build` to hang on remote URL analysis
    // (moduleParseIdleTimeout). The remotes themselves still build with the plugin.
  ],
  server: {
    host: '0.0.0.0',
    port: 5173, // Use Vite's default port instead of conflicting with main server
    hmr: false, // Disable HMR entirely in Codespaces to avoid WebSocket issues
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://contacts.smartcrm.vip',
        'https://ai-analytics.smartcrm.vip',
        'https://calendar.smartcrm.vip',
        'https://pipeline.smartcrm.vip',
        'https://agency.smartcrm.vip',
      ],
      credentials: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      'stream': 'stream-browserify',
      '@crm/openclaw-api': path.resolve(__dirname, 'packages/openclaw-api/src'),
      '@crm/twenty-fields': path.resolve(__dirname, 'packages/twenty-fields/src'),
      '@crm/ai-core': path.resolve(__dirname, 'packages/ai-core/src'),
      '@crm/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@crm/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@crm/workflows': path.resolve(__dirname, 'packages/workflows/src'),
    },
  },
  build: {
    // write to server/public for deployment
    outDir: "../server/public",
    emptyOutDir: true,
    rollupOptions: {
      external: ["@shared/schema"]
    }
  },
  optimizeDeps: {
    exclude: ['simple-peer']
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
    'process.version': '"12.0.0"',
  },
});
