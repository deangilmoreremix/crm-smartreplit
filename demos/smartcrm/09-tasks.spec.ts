import { test } from '@playwright/test';
import { openSmartCRM, clickNav, demoTitle, highlightText, pause } from './helpers';

test('Task management demo', async ({ page }) => {
  await openSmartCRM(page);

  await demoTitle(page, 'SmartCRM Task Management');
  await clickNav(page, 'Tasks');

  await demoTitle(page, 'AI-Prioritized Task Management System');
  await pause(page, 2500);

  await highlightText(page, 'Priority');
  await highlightText(page, 'Due');
  await highlightText(page, 'Complete');

  // Try to create a task
  await demoTitle(page, 'Create Tasks With AI Assistance');
  const addButton = page.getByRole('button', { name: /Add.*Task|New.*Task|Create/i }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await pause(page, 1000);

    // Fill task details
    const titleField = page.locator('input[placeholder*="task"], input[name*="title"]').first();
    if (await titleField.isVisible().catch(() => false)) {
      await titleField.fill('Follow up with John Smith');
    }

    const saveButton = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await pause(page, 2000);
    }
  }

  // Try calendar view
  await demoTitle(page, 'Calendar Integration: Schedule Tasks Visually');
  const calendarButton = page.getByRole('button', { name: /Calendar|Schedule|View/i }).first();
  if (await calendarButton.isVisible().catch(() => false)) {
    await calendarButton.click();
    await pause(page, 2000);
  }

  await demoTitle(page, 'Goal Tracking: Measure Progress & Success');
  await pause(page, 3000);
});
