import { test } from '@playwright/test';

test('overview minimal', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.pause();
});
