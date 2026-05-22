import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'AIGoalsApp',
      filename: 'remoteEntry.js',
      exposes: {
        './AIGoalsApp': './src/AIGoalsApp.tsx',
        './GoalsModule': './src/GoalsModule.tsx'
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
      external: ['react', 'react-dom'],
      output: {
        format: 'systemjs',
        entryFileNames: 'assets/remoteEntry.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
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