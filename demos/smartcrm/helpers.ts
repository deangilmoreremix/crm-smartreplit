import { expect, Page } from '@playwright/test';

export async function pause(page: Page, ms = 1500) {
  await page.waitForTimeout(ms);
}

export async function openSmartCRM(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await pause(page, 2000);
}

export async function clickNav(page: Page, label: string) {
  // Try multiple selectors for navigation
  const navItem = page
    .getByRole('link', { name: new RegExp(label, 'i') })
    .or(page.getByRole('button', { name: new RegExp(label, 'i') }))
    .or(page.getByText(new RegExp(label, 'i')).first());

  await navItem.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await pause(page, 2000);
}

export async function demoTitle(page: Page, title: string) {
  await page.evaluate((text) => {
    const old = document.getElementById('demo-overlay-title');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'demo-overlay-title';
    el.innerText = text;
    el.style.position = 'fixed';
    el.style.top = '24px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.zIndex = '999999';
    el.style.padding = '14px 24px';
    el.style.borderRadius = '999px';
    el.style.background = 'rgba(15, 23, 42, 0.92)';
    el.style.color = 'white';
    el.style.fontSize = '20px';
    el.style.fontWeight = '700';
    el.style.boxShadow = '0 20px 50px rgba(0,0,0,.35)';
    el.style.backdropFilter = 'blur(14px)';
    document.body.appendChild(el);
  }, title);

  await pause(page, 1800);
}

export async function removeDemoTitle(page: Page) {
  await page.evaluate(() => {
    document.getElementById('demo-overlay-title')?.remove();
  });
}

export async function highlightText(page: Page, text: string) {
  const item = page.getByText(new RegExp(text, 'i')).first();
  await expect(item)
    .toBeVisible({ timeout: 10_000 })
    .catch(() => {});
  await item.hover().catch(() => {});
  await pause(page, 1200);
}

// Handle authentication - SmartCRM uses Supabase auth
export async function handleAuth(page: Page) {
  // Check if we're on login page
  const loginForm = page.locator('form').filter({ hasText: /login|sign in/i });
  if (await loginForm.isVisible().catch(() => false)) {
    // Handle login flow - this may need customization based on auth setup
    console.log('Login form detected - authentication may be required');
    await pause(page, 2000);
  }
}

// Wait for iframe to load and be ready
export async function waitForIframeLoad(page: Page, selector = 'iframe') {
  const iframe = page.locator(selector).first();
  await expect(iframe).toBeVisible({ timeout: 15_000 });
  await iframe.waitFor({ state: 'attached' });
  await pause(page, 3000); // Extra time for iframe content to initialize
}

// Switch context to iframe for interactions
export async function switchToIframe(page: Page, selector = 'iframe') {
  const frame = page.frameLocator(selector);
  return frame;
}

// Handle iframe-based remote app demos
export async function handleIframeDemo(page: Page, appName: string, url: string) {
  await demoTitle(page, `${appName} - Remote Application`);
  await waitForIframeLoad(page);

  // For iframe apps, we can still overlay titles and do basic interactions
  // Note: Cross-origin limitations may prevent deep iframe interactions
  await pause(page, 2000);

  await demoTitle(page, `Demonstrating ${appName} features...`);
  await pause(page, 4000); // Allow time to show the remote app
}

// Create sample contact data for demos
export async function createSampleContact(page: Page) {
  // This would trigger contact creation - implementation depends on UI
  const addButton = page.getByRole('button', { name: /add.*contact|new.*contact/i }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await pause(page, 1000);

    // Fill sample data - adjust selectors based on actual form
    const nameField = page.locator('input[name*="name"], input[placeholder*="name"]').first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill('John Smith');
    }

    const emailField = page.locator('input[name*="email"], input[placeholder*="email"]').first();
    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill('john.smith@techcorp.com');
    }

    // Submit form
    const submitButton = page.getByRole('button', { name: /save|create|submit/i }).first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      await pause(page, 2000);
    }
  }
}

// Create sample deal data for demos
export async function createSampleDeal(page: Page) {
  // This would trigger deal creation - implementation depends on UI
  const addButton = page.getByRole('button', { name: /add.*deal|new.*deal/i }).first();
  if (await addButton.isVisible().catch(() => false)) {
    await addButton.click();
    await pause(page, 1000);

    // Fill sample data - adjust selectors based on actual form
    const nameField = page.locator('input[name*="name"], input[placeholder*="deal"]').first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill('Enterprise SaaS Deal');
    }

    const valueField = page.locator('input[name*="value"], input[placeholder*="amount"]').first();
    if (await valueField.isVisible().catch(() => false)) {
      await valueField.fill('50000');
    }

    // Submit form
    const submitButton = page.getByRole('button', { name: /save|create|submit/i }).first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      await pause(page, 2000);
    }
  }
}
