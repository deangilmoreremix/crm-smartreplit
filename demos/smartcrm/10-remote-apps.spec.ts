import { test } from '@playwright/test';
import { openSmartCRM, demoTitle, pause, handleIframeDemo } from './helpers';

test('Remote applications demo', async ({ page }) => {
  await openSmartCRM(page);

  // SmartCRM Closer - Full frame iframe
  await demoTitle(page, 'SmartCRM Closer: Advanced Closing Techniques');
  await page.goto('/smartcrm-closer');
  await handleIframeDemo(page, 'SmartCRM Closer', 'https://agency.smartcrm.vip/');

  // Go back to main app
  await page.goto('/');

  // FunnelCraft AI - Full frame iframe
  await demoTitle(page, 'FunnelCraft AI: Marketing Funnel Optimization');
  await page.goto('/funnelcraft-ai');
  await handleIframeDemo(page, 'FunnelCraft AI', 'remote-funnel-app-url');

  // Go back to main app
  await page.goto('/');

  // ContentAI - Full frame iframe
  await demoTitle(page, 'ContentAI: AI-Powered Content Creation');
  await page.goto('/content-ai');
  await handleIframeDemo(page, 'ContentAI', 'remote-content-app-url');

  await demoTitle(page, 'Complete Remote App Ecosystem');
  await pause(page, 3000);
});
