import { defineConfig, devices } from '@playwright/test';

/**
 * Staging E2E suite. Runs against a deployed stack (Netlify preview + Supabase staging branch), never against production.
 *
 *   E2E_BASE_URL                 https://deploy-preview-N--yoursite.netlify.app
 *   E2E_USER_A_EMAIL / _PASSWORD primary test user (see supabase/seed/test_users.sql)
 *   E2E_USER_B_EMAIL / _PASSWORD second test user (isolation / cross-context checks)
 *   E2E_AI=1                     enable assertions that need a saved OpenAI key
 *
 * Without E2E_BASE_URL / the user credentials every test is skipped (the suite still lists and exits 0).
 * Run: npm run test:e2e   (alias for  npx playwright test --config tests/playwright/staging/playwright.config.ts)
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // the specs share two real accounts; keep them serial
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-staging', open: 'never' }]],
  outputDir: 'test-results-staging',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
