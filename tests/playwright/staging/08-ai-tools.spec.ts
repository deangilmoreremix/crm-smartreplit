import { test, expect } from '@playwright/test';
import { AI_ENABLED, USER_A, gotoApp, login, missingEnv } from './helpers';

/**
 * Flow 8: AI tools smoke. The visible-state assertions always run; anything that calls OpenAI only runs with E2E_AI=1
 * (user A must have an OpenAI key saved under Settings > API Keys).
 */
test.describe('AI tools', () => {
  test.skip(!!missingEnv(), missingEnv());

  test('AI tools page renders', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/ai-tools');
    await expect(page.getByRole('heading', { name: 'AI Tools' })).toBeVisible({ timeout: 30_000 });
  });

  test('assistants dashboard renders', async ({ page }) => {
    await login(page, USER_A);
    await gotoApp(page, '/assistants');
    await expect(page.getByRole('heading', { name: 'AI Assistants Dashboard' })).toBeVisible({ timeout: 30_000 });
  });

  test('assistant chat answers (needs OpenAI)', async ({ page }) => {
    test.skip(!AI_ENABLED, 'set E2E_AI=1 to run assertions that call OpenAI');
    await login(page, USER_A);
    await gotoApp(page, '/assistants');
    await page.getByRole('button', { name: /create|new assistant/i }).first().click();
    const name = `e2e-assistant-${Date.now().toString(36)}`;
    await page.getByPlaceholder(/name/i).first().fill(name);
    await page.getByRole('button', { name: /^(create|save)/i }).last().click();
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
    await page.getByText(name).first().click();
    const box = page.getByPlaceholder(/message|ask|type/i).last();
    await box.fill('Reply with the single word: pong');
    await box.press('Enter');
    await expect(page.getByText(/pong/i).last()).toBeVisible({ timeout: 60_000 });
  });
});
