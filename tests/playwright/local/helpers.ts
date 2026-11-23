import type { Page } from '@playwright/test';

export interface Collected {
  pageErrors: string[];
  consoleErrors: string[];
}

/** Dev-bypass login + deterministic backend: Supabase and /api are stubbed (empty data, 200). */
export async function prepare(page: Page): Promise<Collected> {
  const collected: Collected = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (e) => collected.pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (m) => {
    if (m.type() === 'error') collected.consoleErrors.push(m.text());
  });

  await page.addInitScript(() => {
    // Runs in every frame, including opaque-origin iframes where localStorage throws.
    try {
      localStorage.setItem('smartcrm-dev-mode', 'true');
      localStorage.setItem('smartcrm_show_demo_data', 'true');
      localStorage.setItem('openclaw-setup-seen', 'true'); // returning user: skip the one-time setup modal
    } catch {
      /* not accessible in this frame */
    }
  });

  // Playwright applies the LAST registered matching route first, so the catch-all abort is registered first
  // and the specific stubs below take precedence.
  // External hosts (remotes, fonts, images, CDNs) must not hang the run.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());

  // Anything that would leave the machine is stubbed. Cross-origin stubs need CORS headers (+ preflight).
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };
  await page.route('**/*.supabase.co/**', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = req.url();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
    if (url.includes('/auth/v1/')) return json({ data: { session: null }, session: null, user: null });
    // Full-access entitlement for the dev user (.single() expects one object).
    if (url.includes('/rest/v1/user_entitlements')) {
      return json({ id: 'e2e', email: 'dev@smartcrm.local', package: 'super_admin', openclaw_enabled: true, admin_enabled: true, source: 'local smoke stub' });
    }
    return json([]);
  });
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (/\/api\/(deals|contacts|tasks|appointments)(\?|$)/.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (/\/api\/(crm\/)?companies(\?|$)/.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (/\/api\/workflows(\?|$)/.test(url) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ workflows: [] }) });
    }
    if (url.includes('/api/openai/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: false }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ source: 'fallback', needsApiKey: true }) });
  });
  return collected;
}

/** Errors that are expected without a backend/network (aborted external requests, stubbed API). */
export const IGNORED = [/Failed to load resource/i, /net::ERR/i, /ERR_BLOCKED/i, /favicon/i, /Download the React DevTools/i];
export const relevant = (list: string[]) => list.filter((m) => !IGNORED.some((re) => re.test(m)));
