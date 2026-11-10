/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: [
      'client/src/**/*.{test,spec}.{js,mjs,cjs,ts,mtsx,jsx,tsx}',
      'server/**/*.{test,spec}.{js,mjs,cjs,ts,mtsx,jsx,tsx}',
      'packages/**/src/**/*.{test,spec}.{js,mjs,cjs,ts,mtsx,jsx,tsx}'
    ],
    exclude: [
      // Live-database / live-server integration suites (need Postgres, Stripe, a running app).
      // Opt in with RUN_INTEGRATION_TESTS=1.
      ...(process.env.RUN_INTEGRATION_TESTS
        ? []
        : [
            'server/tests/billing-system.test.js',
            'server/tests/contact-enrichment.test.ts',
            'server/tests/credit-purchase-api.test.ts',
            'server/tests/credit-purchase.test.ts',
          ]),
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'scripts/**'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'client/src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@server': resolve(__dirname, './server'),
      '@shared': resolve(__dirname, './shared'),
      '@smartcrm/workflows': resolve(__dirname, './packages/workflows/src/index.ts')
    }
  }
});