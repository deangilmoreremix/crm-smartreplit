import { test, expect } from '@playwright/test';
import { prepare } from './helpers';

test.describe('layout save/apply/reset and deal creation (local, stubbed backend)', () => {
  test('save a layout, change visibility, apply it back, then reset to default', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    await page.keyboard.press('Escape');
    await page.getByTitle('Dashboard Layout Settings').click();
    const first = page.locator('input[aria-label^="Show "]').first();
    await expect(first).toBeChecked();

    await page.getByPlaceholder('Save layout as...').fill('E2E layout');
    await page.getByTitle('Save layout').click();
    await expect(page.getByTitle('Apply layout').filter({ hasText: 'E2E layout' })).toBeVisible();

    await page.getByTitle('Hide Section').first().click();
    await expect(first).not.toBeChecked();
    await page.getByTitle('Apply layout').filter({ hasText: 'E2E layout' }).click();
    await expect(first).toBeChecked();

    await page.getByTitle('Hide Section').first().click();
    await expect(first).not.toBeChecked();
    await page.getByRole('button', { name: /Reset Layout/ }).click();
    await expect(page.getByRole('alertdialog', { name: 'Confirm reset layout' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm reset' }).click();
    await expect(first).toBeChecked();
    // Saved layouts survive a reset
    await expect(page.getByTitle('Apply layout').filter({ hasText: 'E2E layout' })).toBeVisible();
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('creating a deal posts it with the chosen stage and shows it on the board', async ({ page }) => {
    const c = await prepare(page);
    let posted: Record<string, unknown> | null = null;
    await page.route('**/api/deals', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      posted = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 501, ...posted }),
      });
    });
    await page.goto('/pipeline');
    await page.waitForTimeout(2500);
    await page.locator('button[title="Add Deal"]').nth(1).click();
    await page.getByLabel('Title').fill('E2E Big Deal');
    await page.getByLabel('Value (USD)').fill('4200');
    const stage = await page.getByLabel('Stage').inputValue();
    await page.getByRole('button', { name: 'Create deal' }).click();
    await expect(page.getByText('E2E Big Deal').first()).toBeVisible();
    await expect(page).not.toHaveURL(/new=1/);
    expect(posted).not.toBeNull();
    expect(posted!.title).toBe('E2E Big Deal');
    expect(posted!.value).toBe('4200');
    expect(String(posted!.stage).length).toBeGreaterThan(0);
    expect(stage.length).toBeGreaterThan(0);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('a failed save rolls the deal back and tells the user', async ({ page }) => {
    await prepare(page);
    await page.route('**/api/deals', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' })
        : route.fallback()
    );
    await page.goto('/pipeline?new=1');
    await page.waitForTimeout(2500);
    await page.getByLabel('Title').fill('Doomed Deal');
    await page.getByRole('button', { name: 'Create deal' }).click();
    await expect(page.getByText('Could not create deal').first()).toBeVisible();
    await expect(page.getByText('Doomed Deal', { exact: true })).toHaveCount(0);
  });
});
