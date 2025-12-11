const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

async function testScreenshot() {
  console.log('🧪 Testing Playwright screenshot system...');

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to a simple test page
    console.log('📸 Navigating to test page...');
    await page.goto('https://smartcrm-videoremix.replit.app', { waitUntil: 'networkidle' });

    // Wait a bit for page to load
    await page.waitForTimeout(2000);

    // Create screenshots directory
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take a screenshot
    const screenshotPath = path.join(screenshotsDir, 'test-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('✅ Test screenshot saved to:', screenshotPath);

    await browser.close();
    console.log('🎉 Playwright screenshot system is working!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testScreenshot();