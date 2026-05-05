const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
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
  outputDir: path.resolve(__dirname, 'demo-videos'),
  retries: 1,
});