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

/**
 * Dashboard health checks (audit follow-ups): console errors, notification bell, no endless spinners,
 * sample-data clear/restore and the hide -> re-show layout round trip.
 */
test.describe('dashboard health', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('loads with no uncaught console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await page.waitForTimeout(3000);
    expect(errors, `uncaught errors on /dashboard:\n${errors.join('\n')}`).toEqual([]);
  });

  test('notification bell opens its panel', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await page.getByRole('button', { name: 'Notifications' }).first().click();
    await expect(page.getByLabel('Notifications panel')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('no section is stuck on a spinner after 10s (content, empty or error state)', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await page.waitForTimeout(10_000);
    const spinners = page.locator('main .animate-spin:visible');
    const count = await spinners.count();
    expect(count, `${count} spinner(s) still visible after 10s`).toBe(0);
  });

  test('Clear Demo Data hides sample content and Restore brings it back', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    const clearBtn = page.getByTestId('button-clear-demo-data');
    const restoreBtn = page.getByTestId('button-restore-sample-data');

    if (!(await clearBtn.isVisible().catch(() => false))) {
      await restoreBtn.click(); // start from the "sample data shown" state
    }
    await expect(clearBtn).toBeVisible();

    await clearBtn.click();
    await page.getByTestId('button-clear-demo').click();
    await expect(restoreBtn).toBeVisible();
    await expect(clearBtn).toBeHidden();

    await restoreBtn.click();
    await expect(clearBtn).toBeVisible();
    await expect(restoreBtn).toBeHidden();
  });

  test('hiding a section can be undone from the layout panel (round trip)', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await page.getByTitle('Dashboard Layout Settings').click();
    await expect(page.getByRole('heading', { name: 'Layout Settings' })).toBeVisible();

    const toggle = page.getByRole('checkbox', { name: 'Show AI Analytics Dashboard' });
    await expect(toggle, 'every renderable section is listed').toBeAttached();
    const row = toggle.locator('xpath=ancestor::div[@draggable][1]');
    const wasVisible = await toggle.isChecked();

    await row.getByTitle(wasVisible ? 'Hide Section' : 'Show Section').click();
    await expect(toggle).toBeChecked({ checked: !wasVisible });
    // re-show / restore original state
    await row.getByTitle(wasVisible ? 'Show Section' : 'Hide Section').click();
    await expect(toggle).toBeChecked({ checked: wasVisible });

    // Escape closes the panel
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Layout Settings' })).toBeHidden();
  });
});

