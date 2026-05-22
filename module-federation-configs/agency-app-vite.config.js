// Module Federation Configuration for Agency/FunnelCraft App
// File: vite.config.js (for https://agency.smartcrm.vip)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'AIGoalsApp',
      filename: 'assets/remoteEntry.js',
      exposes: {
        './AIGoalsApp': './AIGoalsApp.tsx',
        './GoalsModule': './GoalsModule.tsx'
      },
      shared: {
        'react': {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        format: 'systemjs',
        entryFileNames: 'assets/remoteEntry.js',
        minifyInternalExports: false,
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  }
})
