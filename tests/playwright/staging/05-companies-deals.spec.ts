import { test, expect } from '@playwright/test';
import { USER_A, apiCall, gotoApp, login, missingEnv, uniq } from './helpers';

/** Flow 5: companies list (create, open record) and deal record page. */
test.describe('companies and deals', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('create a company, open it, see record tabs, delete it', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/companies');
    await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible();

    const name = uniq('E2E Co');
    await page.getByLabel('New company name').fill(name);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(name).first(), 'new company appears in the table').toBeVisible({ timeout: 20_000 });

    // open the record page via the row actions menu ("Add note" navigates to /companies/:id?tab=notes)
    const row = page.getByRole('row').filter({ hasText: name }).first();
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByText('Add note').first().click();
    await page.waitForURL(/\/companies\/[^/?#]+/, { timeout: 20_000 });
    const id = new URL(page.url()).pathname.split('/').pop();
    await expect(page.getByRole('tablist', { name: 'Record sections' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');

    // cleanup
    if (id) await apiCall(page, 'DELETE', `/api/crm/companies/${id}`);
  });

  test('deal record page opens from the pipeline', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/pipeline');
    const dealLink = page.locator('a[href^="/deals/"]').first();
    test.skip((await dealLink.count()) === 0, 'no deal link on /pipeline (run supabase/seed/test_users.sql)');
    await dealLink.click();
    await page.waitForURL(/\/deals\/[^/?#]+/);
    await expect(page.getByRole('tablist', { name: 'Record sections' })).toBeVisible();
    await page.getByRole('tab', { name: 'Timeline' }).click();
    await expect(page.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true');
  });
});
