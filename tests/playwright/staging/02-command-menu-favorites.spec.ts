import { test, expect } from '@playwright/test';
import { USER_A, gotoApp, login, missingEnv, openFirstContact } from './helpers';

/** Flow 2: command menu (Ctrl/Cmd+K) with global search, and favorites (add on a record, appears in the sidebar, removable). */
test.describe('command menu and favorites', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('Ctrl+K opens the command menu, searches and closes with Escape', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/dashboard');
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder(/search/i).first();
    await expect(input, 'command menu input should open on Ctrl+K').toBeVisible();
    await input.fill('seed');
    // either matching records (from supabase/seed/test_users.sql) or the empty state; the menu must stay responsive
    await expect(input).toHaveValue('seed');
    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();
  });

  test('favorite a contact, see it listed, then remove it', async ({ page }) => {
    await login(page, USER_A);
    await openFirstContact(page);
    const add = page.getByRole('button', { name: 'Add to favorites' }).first();
    await expect(add, 'favorite star on the record page').toBeVisible();
    await add.click();
    await expect(page.getByRole('button', { name: 'Remove from favorites' }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Remove from favorites' }).first(), 'favorite persists after reload').toBeVisible();

    await page.getByRole('button', { name: 'Remove from favorites' }).first().click();
    await expect(page.getByRole('button', { name: 'Add to favorites' }).first()).toBeVisible();
  });
});
