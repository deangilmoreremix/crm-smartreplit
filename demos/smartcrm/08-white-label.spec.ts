import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, pause } from './helpers';

test('White label and agency demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM White Label Platform');
  await pause(page, 2000);

  // Try to navigate to white label management
  await demoTitle(page, 'White Label Management: Brand Your CRM');
  const wlButton = page.getByRole('button', { name: /White.*Label|Branding|Customize/i }).first();
  if (await wlButton.isVisible().catch(() => false)) {
    await wlButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Custom Branding: Logos, Colors, Themes');
  await pause(page, 2000);

  await demoTitle(page, 'Domain Management: Your Own URL');
  await pause(page, 2000);

  await demoTitle(page, 'Package Builder: Feature Sets For Clients');
  await pause(page, 2000);

  await demoTitle(page, 'Revenue Sharing: Automated Commission Tracking');
  await pause(page, 2000);

  await demoTitle(page, 'Perfect For Agencies & CRM Resellers');
  await pause(page, 4000);
});
