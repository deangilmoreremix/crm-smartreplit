import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, pause } from './helpers';

test('OpenClaw controlled SmartCRM demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM + OpenClaw Control');
  await pause(page, 2000);

  await demoTitle(page, 'OpenClaw Lets You Control CRM Actions With AI');
  await clickNav(page, 'OpenClaw');

  // Try to find settings/API key configuration
  const settingsButton = page
    .getByRole('button', { name: /Settings|API Key|Connect|Setup/i })
    .first();

  if (await settingsButton.isVisible().catch(() => false)) {
    await settingsButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Connect Your OpenClaw API Key');
  await pause(page, 2500);

  // Try to fill API key field
  const input = page
    .locator('input[type="password"], input[placeholder*="API"], input[name*="api"]')
    .first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill('sk-demo-openclaw-key-hidden');
    await pause(page, 1500);
  }

  await demoTitle(page, 'Now SmartCRM Can Be Controlled By AI Commands');
  await pause(page, 3000);
});
