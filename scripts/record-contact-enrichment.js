const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: '/tmp/recordings' }
  });
  const page = await context.newPage();
  
  // Navigate to app
  await page.goto('http://localhost:3000/contacts');
  
  // Wait for app to load and seed data to be available
  await page.waitForSelector('.contact-detail-view');
  
  // Navigate to a specific contact detail page
  await page.click('.contact-card:first-child');
  await page.waitForSelector('.contact-detail-view');
  
  // Click "Enrich Contact" button
  await page.click('button:has-text("Enrich")');
  
  // Wait for enrichment to complete
  await page.waitForSelector('.enrichment-complete', { timeout: 30000 });
  
  // Show validation results
  await page.screenshot({ path: '/tmp/screenshots/enrichment-validation.png' });
  
  // Display enrichment timestamp
  await page.waitForSelector('.enrichment-timestamp');
  
  // Verify enriched data
  await page.waitForSelector('.contact-field[value*="enriched"]');
  
  await browser.close();
})();
