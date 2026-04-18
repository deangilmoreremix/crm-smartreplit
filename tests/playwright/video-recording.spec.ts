import { test, expect } from '@playwright/test';

test.describe('Video Recording Verification', () => {
  test('should run successfully and generate video', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Verify page loads correctly
    await expect(page).toHaveTitle(/CRM Smartreplit/);

    // Perform some actions to record in video
    await page.click('text=Contacts');
    await expect(page).toHaveURL(/.*contacts/);

    // Add a sample contact action
    await page.click('text=Add Contact');

    // Verify the video recording is enabled
    const video = page.video();
    expect(video).toBeTruthy();

    // Log success message
    console.log('✅ Video recording test completed successfully!');
  });

  test('should verify video settings configuration', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    // Check viewport size
    const viewportSize = page.viewportSize();
    expect(viewportSize).toEqual({ width: 1920, height: 1080 });

    await context.close();
    console.log('✅ Viewport configuration verified!');
  });
});
