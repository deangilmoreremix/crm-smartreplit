import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, removeDemoTitle, pause } from './helpers';

test('SmartCRM overview demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM: The CRM That Helps You Sell');
  await pause(page, 2000);

  await demoTitle(page, 'Dashboard: See Your Sales Operation At A Glance');
  await clickNav(page, 'Dashboard');

  await demoTitle(page, 'Contacts: Manage Every Lead And Customer');
  await clickNav(page, 'Contacts');

  await demoTitle(page, 'Pipeline: Track Deals From Lead To Close');
  await clickNav(page, 'Pipeline');

  await demoTitle(page, 'Calendar: Schedule Follow-Ups And Meetings');
  await clickNav(page, 'Calendar');

  await demoTitle(page, 'AI Tools: Let SmartCRM Help With Selling');
  await clickNav(page, 'AI');

  await removeDemoTitle(page);
  await pause(page, 2000);
});
