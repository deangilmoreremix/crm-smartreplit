import { test, expect } from '@playwright/test';
import { USER_A, gotoApp, login, missingEnv, uniq } from './helpers';

/** Flow 6: settings: data model (custom object), roles, team invite, webhooks, API keys (secret shown once). */
test.describe('settings', () => {
  test.skip(!!missingEnv(), missingEnv());

  test.beforeEach(async ({ page }) => {
    await login(page, USER_A);
  });

  test('data model: add and delete a custom object', async ({ page }) => {
    await gotoApp(page, '/settings/data-model');
    const singular = `E2E${Date.now().toString(36)}`;
    await page.getByPlaceholder('Project').fill(singular);
    await page.getByPlaceholder('Projects').fill(`${singular}s`);
    await page.getByRole('button', { name: 'Add object' }).click();
    await expect(page.getByText(`${singular}s`).first()).toBeVisible({ timeout: 20_000 });
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: `Delete ${singular}s` }).click();
    await expect(page.getByText(`${singular}s`)).toBeHidden({ timeout: 20_000 });
  });

  test('roles: create and delete a role', async ({ page }) => {
    await gotoApp(page, '/settings/roles');
    const name = uniq('e2e role');
    await page.getByPlaceholder('Sales rep').fill(name);
    await page.getByRole('button', { name: 'Add role' }).click();
    await expect(page.getByText(name).or(page.locator(`input[value="${name}"]`)).first()).toBeVisible({ timeout: 20_000 });
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Delete role' }).last().click();
    await expect(page.getByText(name)).toBeHidden({ timeout: 20_000 });
  });

  test('team: invite shows up in the list', async ({ page }) => {
    await gotoApp(page, '/settings/team');
    const email = `${uniq('e2e-invite')}@example.com`;
    await page.locator('input[type="email"]').fill(email);
    await page.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.getByText(email).first()).toBeVisible({ timeout: 20_000 });
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Remove member' }).last().click();
    await expect(page.getByText(email)).toBeHidden({ timeout: 20_000 });
  });

  test('webhooks: add (secret shown once), deliveries, delete', async ({ page }) => {
    await gotoApp(page, '/settings/webhooks');
    await expect(page.getByRole('heading', { name: 'Webhooks' })).toBeVisible();
    const url = `https://example.com/hooks/${uniq('e2e')}`;
    await page.getByPlaceholder('https://example.com/hooks/smartcrm').fill(url);
    await page.getByRole('button', { name: 'Add webhook' }).click();
    await expect(page.getByText(url).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Dismiss' }).first(), 'one-time secret banner').toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).first().click();
    await page.reload();
    await expect(page.getByText(url).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' }), 'secret is not shown again after reload').toHaveCount(0);
    await page.getByRole('button', { name: 'Deliveries' }).last().click();
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('button', { name: 'Delete' }).last().click();
    await expect(page.getByText(url)).toBeHidden({ timeout: 20_000 });
  });

  test('API keys: create (secret once), then revoke', async ({ page }) => {
    await gotoApp(page, '/settings/api-keys-public');
    await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible();
    const name = uniq('e2e key');
    await page.getByLabel('Name').fill(name);
    await page.getByRole('group', { name: 'Scopes' }).getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Create key' }).click();
    await expect(page.getByText(/sk_live_/).first(), 'secret shown once after creation').toBeVisible({ timeout: 20_000 });
    await page.reload();
    await expect(page.getByText(name).first()).toBeVisible();
    await expect(page.getByText(/sk_live_[A-Za-z0-9_-]{20,}/), 'full secret is gone after reload').toHaveCount(0);
    page.once('dialog', (d) => void d.accept());
    await page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Revoke' })).toHaveCount(0, { timeout: 20_000 });
  });
});
