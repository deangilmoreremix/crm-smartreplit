import { test, expect } from '@playwright/test';
import { USER_A, gotoApp, login, missingEnv, openAs, uniq } from './helpers';

/**
 * Flow 9: white-label. Branding saved by user A is read back from the server in a different browser context
 * (no localStorage), and the domains page can request and remove a domain.
 * The domain is only ever 'pending' (DNS verification needs real DNS); get_branding_for_host for ACTIVE domains is covered by supabase/tests/rls.sql.
 */
test.describe('white label', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('company name persists across contexts', async ({ page, browser }) => {
    await login(page, USER_A);
    await gotoApp(page, '/white-label');
    const field = page.locator('#companyName');
    await expect(field).toBeVisible({ timeout: 30_000 });
    const original = await field.inputValue();
    const value = uniq('E2E Brand');
    await field.fill(value);
    await page.getByRole('button', { name: /save/i }).first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 20_000 });

    const second = await openAs(browser, USER_A);
    try {
      await gotoApp(second.page, '/white-label');
      await expect(second.page.locator('#companyName'), 'branding must come from the server, not localStorage').toHaveValue(value, { timeout: 30_000 });
    } finally {
      await second.context.close();
    }

    await field.fill(original);
    await page.getByRole('button', { name: /save/i }).first().click();
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('domains page: add a pending domain and remove it', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/white-label/domains');
    const host = `${uniq('e2e').toLowerCase().replace(/[^a-z0-9-]/g, '')}.example.com`;
    await page.getByLabel('Domain').fill(host);
    await page.getByRole('button', { name: 'Add domain' }).click();
    await expect(page.getByText(host).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/pending/i).first()).toBeVisible();
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('row').filter({ hasText: host }).or(page.locator('li, div').filter({ hasText: host }).last()).getByRole('button', { name: /Remove/ }).first().click();
    await expect(page.getByText(host)).toBeHidden({ timeout: 20_000 });
  });

  test('reserved hostnames are rejected', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/white-label/domains');
    await page.getByLabel('Domain').fill('evil.netlify.app');
    await page.getByRole('button', { name: 'Add domain' }).click();
    await expect(page.getByText(/reserved|invalid|not allowed|error/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
