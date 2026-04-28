import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import federation from "@originjs/vite-plugin-federation";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "client",                // tell Vite where index.html is
  plugins: [
    react(),
    // Only enable federation in production to avoid development issues
    ...(process.env.NODE_ENV === 'production' ? [
      federation({
        name: 'host',
        remotes: {
          PipelineApp: 'https://pipeline.smartcrm.vip/assets/remoteEntry.js',
          AnalyticsApp: 'https://analytics.smartcrm.vip/assets/remoteEntry.js',
          ContactsApp: 'https://contacts.smartcrm.vip/assets/remoteEntry.js',
          CalendarApp: 'https://calendar.smartcrm.vip/assets/remoteEntry.js',
          AIGoalsApp: 'https://agency.smartcrm.vip/assets/remoteEntry.js',
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^18.0.0'
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^18.0.0'
          }
        }
      })
    ] : [])
  ],
  server: {
    host: '0.0.0.0',
    port: 5173, // Use Vite's default port instead of conflicting with main server
    hmr: false, // Disable HMR entirely in Codespaces to avoid WebSocket issues
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
