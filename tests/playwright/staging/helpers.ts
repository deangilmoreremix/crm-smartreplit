import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
}

const env = (k: string): string => (process.env[k] || '').trim();

export const BASE_URL = env('E2E_BASE_URL');
export const USER_A: TestUser = { email: env('E2E_USER_A_EMAIL'), password: env('E2E_USER_A_PASSWORD') };
export const USER_B: TestUser = { email: env('E2E_USER_B_EMAIL'), password: env('E2E_USER_B_PASSWORD') };
export const AI_ENABLED = env('E2E_AI') === '1';

export const hasUser = (u: TestUser): boolean => Boolean(u.email && u.password);

/** Human readable list of missing env vars for a test.skip() reason; empty string when ready. */
export function missingEnv(needB = false): string {
  const miss: string[] = [];
  if (!BASE_URL) miss.push('E2E_BASE_URL');
  if (!USER_A.email) miss.push('E2E_USER_A_EMAIL');
  if (!USER_A.password) miss.push('E2E_USER_A_PASSWORD');
  if (needB && !USER_B.email) miss.push('E2E_USER_B_EMAIL');
  if (needB && !USER_B.password) miss.push('E2E_USER_B_PASSWORD');
  return miss.length ? `missing env: ${miss.join(', ')}` : '';
}

export const uniq = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** UI login through /auth/login (client/src/pages/Auth/Login.tsx); lands on /dashboard. */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.getByTestId('input-email').fill(user.email);
  await page.getByTestId('input-password').fill(user.password);
  await page.getByTestId('button-submit').click();
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
}

/** A fresh browser context (separate storage) with the user logged in. Caller closes the context. */
export async function openAs(browser: Browser, user: TestUser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL: BASE_URL || undefined });
  const page = await context.newPage();
  await login(page, user);
  return { context, page };
}

/** Supabase access token from the page's localStorage (key sb-<ref>-auth-token), for API-level cleanup. */
export async function accessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sb-.+-auth-token$/.test(k)) {
        try {
          const v = JSON.parse(localStorage.getItem(k) || 'null');
          return v?.access_token || v?.currentSession?.access_token || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  });
}

/** Best-effort authenticated API call from the test (cleanup). Never throws. */
export async function apiCall(page: Page, method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: unknown) {
  try {
    const token = await accessToken(page);
    if (!token) return null;
    const res = await page.request.fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: data === undefined ? undefined : JSON.stringify(data),
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* not json */
    }
    return { status: res.status(), json };
  } catch {
    return null;
  }
}

/** Navigates and fails with a readable message if the app bounced us to login or a 404/redirect. */
export async function gotoApp(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page, `expected to stay on ${path} (not redirected to login)`).not.toHaveURL(/\/auth\/login|\/signin/);
}

/** Opens the first contact record page by following the first /contacts/<id> link in the contacts list. */
export async function openFirstContact(page: Page): Promise<string> {
  await gotoApp(page, '/contacts');
  const link = page.locator('a[href^="/contacts/"]:not([href="/contacts/duplicates"]):not([href="/contacts/relationships"])').first();
  const alt = page.getByRole('button', { name: /open record/i }).first();
  if (await link.count()) {
    await link.click();
  } else if (await alt.count()) {
    await alt.click();
  } else {
    // Row context menu path used by ContactsManager ("Open record")
    await page.getByRole('button', { name: 'Row actions' }).first().click();
    await page.getByText('Open record').first().click();
  }
  await page.waitForURL(/\/contacts\/[^/?#]+/, { timeout: 20_000 });
  return new URL(page.url()).pathname;
}
