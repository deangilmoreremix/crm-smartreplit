import { defineConfig, devices } from '@playwright/test';

/**
 * Local browser smoke (no credentials): the built client served by any static host, dev-bypass login,
 * Supabase + /api calls stubbed so results are deterministic.
 *   LOCAL_BASE_URL (default http://127.0.0.1:5000)
 * Run: npx playwright test --config tests/playwright/local/playwright.config.ts --trace off
 * Build the client for it with dummy env so Supabase counts as configured:
 *   VITE_SUPABASE_URL=https://dummy.supabase.co VITE_SUPABASE_ANON_KEY=dummy npx vite build --outDir <dir>
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: process.env.LOCAL_SMOKE_OUT || 'test-results-local',
  use: {
    baseURL: process.env.LOCAL_BASE_URL || 'http://127.0.0.1:5000',
    headless: true,
    // Use the sandbox's pre-installed Chromium when set (e.g. /opt/pw-browsers/chromium-1243/chrome-linux64/chrome).
    launchOptions: process.env.LOCAL_CHROMIUM ? { executablePath: process.env.LOCAL_CHROMIUM, args: ['--no-sandbox'] } : {},
    viewport: { width: 1440, height: 900 },
    screenshot: 'off',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
