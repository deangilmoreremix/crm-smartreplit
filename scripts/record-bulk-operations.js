const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: '/tmp/recordings' }
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/contacts');
  await page.waitForSelector('.contact-list');
  
  // Select multiple contacts
  await page.click('.contact-checkbox:first-child');
  await page.click('.contact-checkbox:nth-child(2)');
  await page.click('.contact-checkbox:nth-child(3)');
  
  // Open bulk operations toolbar
  await page.click('.bulk-operations-button');
  
  // Choose enrichment action
  await page.click('.bulk-enrich-button');
  
  // Show progress indicator
  await page.waitForSelector('.progress-indicator');
  
  // Wait for completion
  await page.waitForSelector('.completion-summary');
  
  // Display summary
  await page.screenshot({ path: '/tmp/screenshots/bulk-summary.png' });
  
  await browser.close();
})();
