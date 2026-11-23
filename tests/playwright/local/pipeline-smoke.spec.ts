import { test, expect } from '@playwright/test';
import { prepare } from './helpers';

test.describe('pipeline (local, stubbed backend)', () => {
  test('column "+" opens the create-deal dialog with that stage preselected', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/pipeline');
    await page.waitForTimeout(3000);
    const addButtons = page.locator('button[title="Add Deal"]');
    expect(await addButtons.count()).toBeGreaterThan(1);
    // Use the second column's button so a default-to-first-stage bug would be caught.
    await addButtons.nth(1).click();
    await expect(page).toHaveURL(/new=1&stage=/);
    const dialogSelect = page.getByLabel('Stage');
    await expect(dialogSelect).toBeVisible();
    const preset = new URL(page.url()).searchParams.get('stage');
    await expect(dialogSelect).toHaveValue(preset!);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('sample deals render as cards and can be dragged between stages without errors', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/pipeline');
    await page.waitForTimeout(3000);
    const cards = page.locator('[data-deal-id]');
    expect(await cards.count()).toBeGreaterThan(0);
    const first = cards.first();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + 20, { steps: 5 });
    await page.mouse.move(box!.x + box!.width + 320, box!.y + 20, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('Pipeline / AI Analytics tabs are visible and clickable (not hidden under the navbar)', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/pipeline');
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /AI Analytics/ }).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /^📊?\s*Pipeline$/ }).click();
    await page.waitForTimeout(500);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });
});
