const { test, expect } = require('@playwright/test');

test.describe('Lead Scoring Video Demo', () => {
  test('should demonstrate lead scoring visualization', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to leads dashboard
    await page.goto('http://localhost:3000/leads');
    await page.waitForSelector('.lead-dashboard');
    
    // Check scoring indicators
    await expect(page.locator('.lead-score-card')).toHaveCount(3);
    
    // Click on a lead to show details
    await page.click('.lead-score-card:first-child');
    await page.waitForSelector('.lead-detail-panel');
    
    // Show AI rationale
    await page.click('.show-rationale');
    await expect(page.locator('.ai-scoring-rationale')).toBeVisible();
    
    // Test sorting
    await page.click('.sort-score-button');
    await page.waitForSelector('.sorted-leads');
    
    // Trigger interaction and score update
    await page.click('.record-interaction');
    await page.waitForSelector('.score-update-animation');
    
    // Check confidence indicators
    await expect(page.locator('.confidence-meter')).toBeVisible();
  });
});
