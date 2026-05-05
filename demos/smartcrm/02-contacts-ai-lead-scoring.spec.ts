import { test } from '@playwright/test';
import {
  openSmartCRM,
  clickNav,
  demoTitle,
  highlightText,
  pause,
  createSampleContact,
} from './helpers';

test('Contacts and AI lead scoring demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM Contact Intelligence');
  await clickNav(page, 'Contacts');

  await demoTitle(page, 'View Leads, Customers, And Opportunities In One Place');
  await pause(page, 2000);

  await highlightText(page, 'Lead');
  await highlightText(page, 'Score');

  await demoTitle(page, 'Use AI To Score Leads And Find The Best Opportunities');

  // Try to find and click AI enrich/score button
  const aiButton = page.getByRole('button', { name: /AI|Score|Analyze|Enrich/i }).first();
  if (await aiButton.isVisible().catch(() => false)) {
    await aiButton.click();
    await pause(page, 3000);
  }

  await demoTitle(page, 'SmartCRM Helps You Know Who To Follow Up With First');

  // Try to create a sample contact
  await createSampleContact(page);

  await pause(page, 3000);
});
