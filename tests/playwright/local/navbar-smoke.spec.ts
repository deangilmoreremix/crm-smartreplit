import { test, expect } from '@playwright/test';
import { prepare } from './helpers';

test.describe('navbar overflow', () => {
  test('at 1440px the hidden pills are reachable with the scroll arrows', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/contacts');
    await page.waitForTimeout(3000);
    const right = page.getByTestId('nav-scroll-right');
    const left = page.getByTestId('nav-scroll-left');
    await expect(right).toBeVisible();
    await expect(left).toHaveCount(0);

    // Scroll until the last pills are in view.
    for (let i = 0; i < 6 && (await right.count()) > 0; i++) {
      await right.click();
      await page.waitForTimeout(500);
    }
    await expect(left).toBeVisible();
    await expect(right).toHaveCount(0);

    await page.getByTestId('nav-settings').click();
    await expect(page.getByText('Data Model').first()).toBeVisible();
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('the left arrow scrolls back to the first pills', async ({ page }) => {
    await prepare(page);
    await page.goto('/contacts');
    await page.waitForTimeout(3000);
    await page.getByTestId('nav-scroll-right').click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 6 && (await page.getByTestId('nav-scroll-left').count()) > 0; i++) {
      await page.getByTestId('nav-scroll-left').click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByTestId('nav-scroll-left')).toHaveCount(0);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
  });
});
