import { test } from '@playwright/test';

test('simple navigation', async ({ page }) => {
  await page.goto('http://localhost:5000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshot.png' });
});
