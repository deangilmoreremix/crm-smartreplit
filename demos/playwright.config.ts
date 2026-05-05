import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.resolve(__dirname, 'smartcrm'),
  timeout: 120_000,
  use: {
    headless: true,
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
    baseURL: process.env.SMARTCRM_URL || 'http://localhost:5000',
  },
  outputDir: 'demo-videos',
  retries: 1,
});