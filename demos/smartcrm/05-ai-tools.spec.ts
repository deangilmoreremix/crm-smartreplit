import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, highlightText, pause } from './helpers';

test('SmartCRM AI tools demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM AI Tools Suite');
  await clickNav(page, 'AI Tools');

  await demoTitle(page, '60+ AI Features To Supercharge Your Sales');
  await pause(page, 2500);

  await highlightText(page, 'Email');
  await highlightText(page, 'Meeting');
  await highlightText(page, 'Proposal');

  // Try email analysis
  await demoTitle(page, 'Email Analysis: Understand Sentiment & Key Insights');
  const emailButton = page.getByRole('button', { name: /Email|Analyze|Sentiment/i }).first();
  if (await emailButton.isVisible().catch(() => false)) {
    await emailButton.click();
    await pause(page, 2000);
  }

  // Try proposal generator
  await demoTitle(page, 'AI Proposal Generator: Win More Deals');
  const proposalButton = page.getByRole('button', { name: /Proposal|Generate|Create/i }).first();
  if (await proposalButton.isVisible().catch(() => false)) {
    await proposalButton.click();
    await pause(page, 2000);
  }

  // Try call script generator
  await demoTitle(page, 'Call Scripts: Handle Objections Like A Pro');
  const scriptButton = page.getByRole('button', { name: /Script|Call|Objection/i }).first();
  if (await scriptButton.isVisible().catch(() => false)) {
    await scriptButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Turn Repetitive Sales Work Into AI-Assisted Workflows');
  await pause(page, 3000);
});
