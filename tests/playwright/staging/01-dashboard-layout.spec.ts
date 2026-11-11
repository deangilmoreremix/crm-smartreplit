import { test, expect } from '@playwright/test';
import { USER_A, gotoApp, login, missingEnv, openAs } from './helpers';

/**
 * Flow 1: dashboard layout persistence.
 * Hide/show a dashboard section in the layout panel, then prove the choice is stored server-side (user_ui_preferences)
 * by logging in from a brand new browser context (empty localStorage) and seeing the same state.
 */
test.describe('dashboard layout persistence', () => {
  test.skip(!!missingEnv(), missingEnv());

  const sectionToggle = (page: import('@playwright/test').Page) => page.getByRole('checkbox', { name: /^Show / }).first();

  async function openPanel(page: import('@playwright/test').Page) {
    await page.getByTitle('Dashboard Layout Settings').click();
    await expect(page.getByRole('heading', { name: 'Layout Settings' })).toBeVisible();
  }

  test('hidden section persists across a new browser context', async ({ page, browser }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await openPanel(page);

    const toggle = sectionToggle(page);
    const label = (await toggle.getAttribute('aria-label')) || '';
    expect(label, 'layout panel lists at least one section').toMatch(/^Show /);
    const before = await toggle.isChecked();
    // the visible eye button next to the (sr-only) checkbox
    await page.getByTitle(before ? 'Hide Section' : 'Show Section').first().click();
    await expect(toggle).toBeChecked({ checked: !before });

    // layout is saved with a debounce; give it a moment, then verify from a fresh context
    await page.waitForTimeout(3000);
    const second = await openAs(browser, USER_A);
    try {
      await gotoApp(second.page, '/dashboard');
      await openPanel(second.page);
      const same = second.page.getByRole('checkbox', { name: label });
      await expect(same, 'section state must survive a new browser context (server-side persistence)').toBeChecked({ checked: !before });
    } finally {
      await second.context.close();
    }

    // restore the original state so the test is repeatable
    await page.getByTitle(!before ? 'Hide Section' : 'Show Section').first().click();
    await expect(toggle).toBeChecked({ checked: before });
    await page.waitForTimeout(2000);
  });

  test('reset layout restores defaults', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await openPanel(page);
    await page.getByText('Reset Layout').click();
    await expect(sectionToggle(page)).toBeVisible();
  });
});
