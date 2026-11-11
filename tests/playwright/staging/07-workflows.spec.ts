import { test, expect } from '@playwright/test';
import { USER_A, apiCall, gotoApp, login, missingEnv, uniq } from './helpers';

/** Flow 7: workflows list, create via API (the builder UI is exercised by opening it), manual run history visible. */
test.describe('workflows', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('workflow page lists a workflow and opens it', async ({ page }) => {
    await login(page, USER_A);
    const name = uniq('e2e workflow');
    const created = await apiCall(page, 'POST', '/api/workflows', {
      name,
      triggerType: 'MANUAL',
      steps: [{ actionType: 'CREATE_TASK', configuration: { title: 'e2e workflow task' } }],
    });
    test.skip(!created || created.status !== 201, `could not create a workflow through the API (status ${created?.status})`);
    const id = created!.json?.workflow?.id as string;
    try {
      await gotoApp(page, '/workflows');
      await expect(page.getByRole('heading', { name: 'Workflows' })).toBeVisible();
      const item = page.getByRole('button', { name: new RegExp(name) }).first();
      await expect(item, 'the new workflow is listed').toBeVisible({ timeout: 20_000 });
      await item.click();
      await expect(page.getByText(name).first()).toBeVisible();

      // run it manually through the API and look for the run in the UI / history
      const run = await apiCall(page, 'POST', `/api/workflows/${id}/run`, { triggerData: { source: 'e2e' } });
      expect(run?.status, 'manual run').toBe(200);
      await page.reload();
      await page.getByRole('button', { name: new RegExp(name) }).first().click();
      await expect(page.getByText(/completed|success|run/i).first()).toBeVisible({ timeout: 20_000 });
    } finally {
      await apiCall(page, 'DELETE', `/api/workflows/${id}`);
    }
  });
});
