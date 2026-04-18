const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        video: { 
          size: { width: 1920, height: 1080 }
        }
      }
    }
  ],
});
