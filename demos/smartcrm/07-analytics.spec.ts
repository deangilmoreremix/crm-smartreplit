import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, highlightText, pause } from './helpers';

test('Analytics and business intelligence demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM Analytics Dashboard');
  await clickNav(page, 'Analytics');

  await demoTitle(page, 'Comprehensive Sales Analytics & Business Intelligence');
  await pause(page, 2500);

  await highlightText(page, 'Revenue');
  await highlightText(page, 'Pipeline');
  await highlightText(page, 'Forecast');

  // Try deal intelligence
  await demoTitle(page, 'Deal Intelligence: AI-Powered Deal Analysis');
  const dealButton = page.getByRole('button', { name: /Deal|Intelligence|Analysis/i }).first();
  if (await dealButton.isVisible().catch(() => false)) {
    await dealButton.click();
    await pause(page, 2000);
  }

  // Try contact analytics
  await demoTitle(page, 'Contact Analytics: Lead Scoring & Engagement');
  const contactButton = page.getByRole('button', { name: /Contact|Lead|Engagement/i }).first();
  if (await contactButton.isVisible().catch(() => false)) {
    await contactButton.click();
    await pause(page, 2000);
  }

  // Try forecasting
  await demoTitle(page, 'Revenue Forecasting: Predictive Analytics');
  const forecastButton = page.getByRole('button', { name: /Forecast|Predict|Revenue/i }).first();
  if (await forecastButton.isVisible().catch(() => false)) {
    await forecastButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Data-Driven Insights For Better Sales Decisions');
  await pause(page, 3000);
});
