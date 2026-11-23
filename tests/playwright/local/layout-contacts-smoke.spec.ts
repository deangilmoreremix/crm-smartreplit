import { test, expect } from '@playwright/test';
import { prepare } from './helpers';

test.describe('layout editor and contacts (local, stubbed backend)', () => {
  test('layout editor opens, a section can be hidden and shown again', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    await page.getByTitle('Dashboard Layout Settings').click();
    // The visible control is the eye button; the aria-labelled checkbox mirrors the section's state.
    const checks = page.locator('input[aria-label^="Show "]');
    expect(await checks.count()).toBeGreaterThan(2);
    const first = checks.first();
    await expect(first).toBeChecked();
    await page.getByTitle('Hide Section').first().click();
    await expect(first).not.toBeChecked();
    await page.getByTitle('Show Section').first().click();
    await expect(first).toBeChecked();
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('contacts page shows the Manage tab and every tab switches without errors', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/contacts');
    await page.waitForTimeout(3000);
    await page.locator('main').getByRole('button', { name: /Manage/ }).first().click();
    await page.waitForTimeout(800);
    expect(await page.locator('body').innerText()).not.toMatch(/Something went wrong/i);
    for (const name of [/Analytics/, /Contacts$/]) {
      await page.locator('main').getByRole('button', { name }).first().click();
      await page.waitForTimeout(800);
    }
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('sample contacts appear (labeled) in the Manage table only while sample data is on', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/contacts');
    await page.waitForTimeout(3000);
    await expect(page.getByText('Jane Doe').first()).toBeVisible();
    await expect(page.getByText(/sample/i).first()).toBeVisible();
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('no sample contacts in the Manage table when sample data is off', async ({ page }) => {
    await prepare(page);
    await page.addInitScript(() => {
      try { localStorage.setItem('smartcrm_show_demo_data', 'false'); } catch { /* ignore */ }
    });
    await page.goto('/contacts');
    await page.waitForTimeout(3000);
    await expect(page.getByText('Jane Doe')).toHaveCount(0);
    await expect(page.getByText(/No contacts yet/)).toBeVisible();
  });
});
