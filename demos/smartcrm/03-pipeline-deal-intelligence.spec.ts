import { test } from '@playwright/test';
import {
  openSmartCRM,
  clickNav,
  demoTitle,
  highlightText,
  pause,
  createSampleDeal,
} from './helpers';

test('Pipeline and deal intelligence demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM Deal Pipeline');
  await clickNav(page, 'Pipeline');

  await demoTitle(page, 'Track Every Deal Stage Visually');
  await pause(page, 2500);

  await highlightText(page, 'New');
  await highlightText(page, 'Qualified');
  await highlightText(page, 'Won');

  await demoTitle(page, 'AI Deal Intelligence Helps Spot Risk And Opportunity');

  // Try to find and click analyze button
  const analyzeButton = page
    .getByRole('button', { name: /Analyze|AI|Risk|Forecast|Insight/i })
    .first();

  if (await analyzeButton.isVisible().catch(() => false)) {
    await analyzeButton.click();
    await pause(page, 3000);
  }

  // Try to create a sample deal
  await createSampleDeal(page);

  await demoTitle(page, 'Know Which Deals Need Attention Before They Go Cold');
  await pause(page, 3000);
});
