const { test, expect } = require('@playwright/test');

test.describe('Contact Enrichment Video Demo', () => {
  test('should demonstrate contact enrichment workflow', async ({ page }) => {
    // Set viewport for consistent recording
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to contacts page
    await page.goto('http://localhost:3000/contacts');
    await page.waitForSelector('.contact-list');
    
    // Select a contact
    await page.click('.contact-card:first-child');
    await page.waitForSelector('.contact-detail-view');
    
    // Click enrich button
    await page.click('button:has-text("Enrich")');
    
    // Wait for enrichment completion
    await page.waitForSelector('.enriched-data', { timeout: 30000 });
    
    // Verify enriched data appears
    await expect(page.locator('.enriched-name')).toBeVisible();
    await expect(page.locator('.enriched-company')).toBeVisible();
    
    // Check enrichment timestamp
    await expect(page.locator('.enrichment-timestamp')).toBeVisible();
    
    // Verify data quality indicators
    await expect(page.locator('.confidence-badge')).toBeVisible();
  });
});
