import { test, expect } from '@playwright/test';
import { prepare, relevant } from './helpers';

const SHOTS = process.env.LOCAL_SMOKE_SHOTS || '';
const shot = async (page: import('@playwright/test').Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
};

// First-run "AI API Key Setup" modal appears when no key is saved; dismiss it like a user would.
const dismissFirstRun = async (page: import('@playwright/test').Page) => {
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
};

test.describe('dashboard (local, stubbed backend)', () => {
  test('boots, renders the dashboard without uncaught errors', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(4000);
    await shot(page, '01-dashboard');
    expect(await page.locator('body').innerText()).not.toMatch(/Something went wrong/i);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
    expect(relevant(c.consoleErrors), relevant(c.consoleErrors).join('\n')).toEqual([]);
  });

  test('no section spins forever', async ({ page }) => {
    await prepare(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(12000);
    await shot(page, '02-dashboard-after-12s');
    const spinners = await page.locator('main .animate-spin, [role="status"].animate-spin').count();
    expect(spinners).toBeLessThanOrEqual(1);
  });

  test('notification bell opens without crashing', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/dashboard');
    await dismissFirstRun(page);
    const bell = page.getByRole('button', { name: /notifications/i }).first();
    await expect(bell).toBeVisible();
    await bell.click();
    await page.waitForTimeout(500);
    await shot(page, '03-bell-open');
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('command menu opens with Ctrl+K and navigates in-app', async ({ page }) => {
    const c = await prepare(page);
    await page.goto('/dashboard');
    await dismissFirstRun(page);
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await shot(page, '04-command-menu');
    await expect(page.getByPlaceholder(/search|type a command/i).first()).toBeVisible();
    expect(c.pageErrors).toEqual([]);
  });

  test('with sample data off the whole dashboard shows no sample people or deals', async ({ page }) => {
    const c = await prepare(page);
    await page.addInitScript(() => {
      try { localStorage.setItem('smartcrm_show_demo_data', 'false'); } catch { /* ignore */ }
    });
    await page.goto('/dashboard');
    await dismissFirstRun(page);
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(300);
    }
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/Jane Doe|John Smith|Sarah Johnson|Acme/);
    expect(text).toMatch(/Sample data is hidden/);
    expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
  });

  test('Clear Demo Data hides samples and Restore brings them back', async ({ page }) => {
    await prepare(page);
    await page.goto('/dashboard');
    await dismissFirstRun(page);
    const clear = page.getByTestId('button-clear-demo-data').or(page.getByTestId('button-clear-demo')).first();
    await expect(clear).toBeVisible();
    await clear.click();
    await page.getByRole('button', { name: /^clear|clear demo data/i }).last().click().catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, '05-after-clear');
    // Sample participant widget must disappear with the rest of the sample data
    await expect(page.getByText('Jane Doe')).toHaveCount(0);
    const restore = page.getByTestId('button-restore-sample-data').first();
    await expect(restore).toBeVisible();
    await restore.click();
    await page.waitForTimeout(800);
    await shot(page, '06-after-restore');
    await expect(page.getByText('Jane Doe').first()).toBeVisible();
    await expect(clear).toBeVisible();
  });
});

const LINKS = ['/contacts', '/pipeline', '/tasks', '/appointments', '/calendar', '/analytics', '/settings', '/help', '/companies', '/workflows', '/ai-goals', '/profile', '/contacts/duplicates', '/deals/demo-1'];
test.describe('routes render (no redirect to landing, no uncaught errors)', () => {
  for (const path of LINKS) {
    test(path, async ({ page }) => {
      const c = await prepare(page);
      await page.goto(path);
      await page.waitForTimeout(3000);
      await shot(page, `route${path.replace(/\//g, '_')}`);
      const url = new URL(page.url());
      expect(['/', '/upgrade', '/signin', '/login'], `redirected away from ${path} to ${url.pathname}`).not.toContain(url.pathname);
      expect(c.pageErrors, c.pageErrors.join('\n')).toEqual([]);
    });
  }
});
