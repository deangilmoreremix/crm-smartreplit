import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, pause } from './helpers';

test('Communication hub demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM Communication Hub');
  await clickNav(page, 'Communication');

  await demoTitle(page, 'Unified Communication Tools For Sales Teams');
  await pause(page, 2000);

  // Try calendar/appointments
  await demoTitle(page, 'Calendar: Schedule Meetings & Follow-Ups');
  const calendarButton = page
    .getByRole('button', { name: /Calendar|Schedule|Appointment/i })
    .first();
  if (await calendarButton.isVisible().catch(() => false)) {
    await calendarButton.click();
    await pause(page, 2000);
  }

  // Try video email
  await demoTitle(page, 'Video Email: Personalized Video Messaging');
  const videoButton = page.getByRole('button', { name: /Video|Record|Email/i }).first();
  if (await videoButton.isVisible().catch(() => false)) {
    await videoButton.click();
    await pause(page, 3000);
  }

  // Try text messages
  await demoTitle(page, 'SMS Automation: Text Campaign Management');
  const smsButton = page.getByRole('button', { name: /SMS|Text|Message/i }).first();
  if (await smsButton.isVisible().catch(() => false)) {
    await smsButton.click();
    await pause(page, 2000);
  }

  // Try phone system
  await demoTitle(page, 'Phone System: VoIP & Call Management');
  const phoneButton = page.getByRole('button', { name: /Phone|Call|VoIP/i }).first();
  if (await phoneButton.isVisible().catch(() => false)) {
    await phoneButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Complete Communication Suite For Modern Sales');
  await pause(page, 3000);
});
