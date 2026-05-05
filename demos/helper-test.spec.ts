import { test } from '@playwright/test';
import { openSmartCRM } from './smartcrm/helpers';

test('simple with helper', async ({ page }) => {
  await openSmartCRM(page);
  await page.screenshot({ path: 'screenshot-helper.png' });
});
