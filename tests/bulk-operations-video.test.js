const { test, expect } = require('@playwright/test');

test.describe('Bulk Operations Video Demo', () => {
  test('should demonstrate bulk contact operations', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to contacts
    await page.goto('http://localhost:3000/contacts');
    await page.waitForSelector('.contact-list');
    
    // Select multiple contacts
    await page.click('.contact-checkbox >> nth=0');
    await page.click('.contact-checkbox >> nth=1');
    await page.click('.contact-checkbox >> nth=2');
    
    // Open bulk operations
    await page.click('.bulk-operations-trigger');
    await page.waitForSelector('.bulk-operations-panel');
    
    // Perform enrichment
    await page.click('.bulk-enrich');
    
    // Wait for progress
    await page.waitForSelector('.bulk-progress');
    
    // Wait for completion
    await page.waitForSelector('.bulk-completion-summary');
    
    // Verify updated counts
    await expect(page.locator('.updated-contacts-count')).toBeVisible();
  });
});
