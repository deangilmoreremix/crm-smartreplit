const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: '/tmp/recordings' }
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/leads');
  await page.waitForSelector('.lead-dashboard');
  
  // Display scoring indicators on contact cards
  await page.waitForSelector('.lead-score-indicator');
  
  // Click scoring details to show AI rationale
  await page.click('.lead-score-card:first-child');
  await page.waitForSelector('.ai-rationale');
  
  // Demonstrate score sorting/reordering
  await page.click('.sort-by-score-button');
  await page.waitForSelector('.sorted-by-score');
  
  // Show real-time score updates
  await page.click('.interaction-button');
  await page.waitForSelector('.score-update');
  
  // Display prediction/confidence indicators
  await page.waitForSelector('.prediction-confidence');
  
  await browser.close();
})();
