import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { USER_A, apiCall, gotoApp, login, missingEnv, uniq } from './helpers';

/**
 * Flow 3: contacts manage table: sort, filter, inline edit, bulk selection, export, CSV import, saved view.
 * Needs at least a few contacts (run supabase/seed/test_users.sql).
 */
test.describe('contacts manage table', () => {
  test.skip(!!missingEnv(), missingEnv());

  test.beforeEach(async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/contacts');
    await expect(page.getByRole('columnheader').first(), 'record table with column headers').toBeVisible({ timeout: 30_000 });
  });

  test('sort by clicking a column header', async ({ page }) => {
    const header = page.getByRole('columnheader').first();
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.getByRole('button').click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  test('search box filters rows', async ({ page }) => {
    const search = page.getByRole('searchbox').first();
    await search.fill(uniq('no-such-contact'));
    await expect(page.getByRole('row').filter({ has: page.getByLabel('Select row') })).toHaveCount(0);
    await search.fill('');
  });

  test('filter builder opens and adds a condition', async ({ page }) => {
    await page.getByRole('button', { name: /^Filters/ }).click();
    await expect(page.getByLabel('Filter field').first().or(page.getByText('Match').first())).toBeVisible();
  });

  test('inline edit saves a cell and persists after reload', async ({ page }) => {
    const cell = page.locator('[data-edit-cell]').first();
    await expect(cell).toBeVisible();
    const before = (await cell.innerText()).trim();
    const value = uniq('e2e');
    await cell.click();
    const input = page.locator('[data-edit-cell] input').first();
    await input.fill(value);
    await input.press('Enter');
    await expect(page.getByText(value).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(value).first(), 'inline edit must persist').toBeVisible({ timeout: 30_000 });
    // restore
    const again = page.locator('[data-edit-cell]').filter({ hasText: value }).first();
    await again.click();
    const restore = page.locator('[data-edit-cell] input').first();
    await restore.fill(before === '-' ? '' : before);
    await restore.press('Enter');
  });

  test('select rows shows the bulk action bar', async ({ page }) => {
    await page.getByLabel('Select row').first().check();
    await expect(page.getByRole('toolbar', { name: 'Bulk actions' })).toBeVisible();
    await page.getByLabel('Select all rows').check();
    await expect(page.getByRole('toolbar', { name: 'Bulk actions' })).toBeVisible();
  });

  test('export CSV downloads a file', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Export CSV/ }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test('import CSV through the import modal', async ({ page }) => {
    const email = `${uniq('e2e-import')}@example.com`;
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-')), 'contacts.csv');
    fs.writeFileSync(file, `first_name,last_name,email\nE2E,Import,${email}\n`);
    await page.getByRole('button', { name: /Import CSV/ }).click();
    await page.locator('input[type="file"]').first().setInputFiles(file);
    // the modal parses the file and offers an import button once the mapping step is reached
    const importBtn = page.getByRole('button', { name: /^(Import|Import \d+ contacts?|Confirm)/ }).last();
    await expect(importBtn).toBeVisible({ timeout: 20_000 });
    await importBtn.click();
    await expect(page.getByText(/Import Complete|imported/i).first()).toBeVisible({ timeout: 30_000 });
    await page.reload();
    await page.getByRole('searchbox').first().fill(email);
    await expect(page.getByText(email).first(), 'imported contact is listed').toBeVisible({ timeout: 20_000 });
    // clean up through the API (best effort)
    const all = await apiCall(page, 'GET', '/api/contacts');
    const rows: Array<{ id: number | string; email?: string }> = Array.isArray(all?.json) ? all!.json : all?.json?.contacts || [];
    for (const c of rows.filter((r) => r.email === email)) await apiCall(page, 'DELETE', `/api/contacts/${c.id}`);
  });

  test('save a view and re-open it', async ({ page }) => {
    const name = uniq('e2e-view');
    await page.getByRole('button', { name: 'Saved views' }).click();
    await page.getByPlaceholder(/view name/i).fill(name);
    await page.getByRole('button', { name: /^Save/ }).click();
    await expect(page.getByText(name)).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Saved views' }).click();
    await expect(page.getByText(name), 'saved view persists after reload').toBeVisible();
    await page.getByRole('button', { name: `Delete view ${name}` }).click();
    await expect(page.getByText(name)).toBeHidden();
  });
});
