# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demos/helper-test.spec.ts >> simple with helper
- Location: demos/helper-test.spec.ts:4:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { expect, Page } from '@playwright/test';
  2   | 
  3   | export async function pause(page: Page, ms = 1500) {
  4   |   await page.waitForTimeout(ms);
  5   | }
  6   | 
  7   | export async function openSmartCRM(page: Page) {
> 8   |   await page.goto('/');
      |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  9   |   await page.waitForLoadState('networkidle');
  10  |   await pause(page, 2000);
  11  | }
  12  | 
  13  | export async function clickNav(page: Page, label: string) {
  14  |   // Try multiple selectors for navigation
  15  |   const navItem = page.getByRole('link', { name: new RegExp(label, 'i') })
  16  |     .or(page.getByRole('button', { name: new RegExp(label, 'i') }))
  17  |     .or(page.getByText(new RegExp(label, 'i')).first());
  18  | 
  19  |   await navItem.click();
  20  |   await page.waitForLoadState('networkidle').catch(() => {});
  21  |   await pause(page, 2000);
  22  | }
  23  | 
  24  | export async function demoTitle(page: Page, title: string) {
  25  |   await page.evaluate((text) => {
  26  |     const old = document.getElementById('demo-overlay-title');
  27  |     if (old) old.remove();
  28  | 
  29  |     const el = document.createElement('div');
  30  |     el.id = 'demo-overlay-title';
  31  |     el.innerText = text;
  32  |     el.style.position = 'fixed';
  33  |     el.style.top = '24px';
  34  |     el.style.left = '50%';
  35  |     el.style.transform = 'translateX(-50%)';
  36  |     el.style.zIndex = '999999';
  37  |     el.style.padding = '14px 24px';
  38  |     el.style.borderRadius = '999px';
  39  |     el.style.background = 'rgba(15, 23, 42, 0.92)';
  40  |     el.style.color = 'white';
  41  |     el.style.fontSize = '20px';
  42  |     el.style.fontWeight = '700';
  43  |     el.style.boxShadow = '0 20px 50px rgba(0,0,0,.35)';
  44  |     el.style.backdropFilter = 'blur(14px)';
  45  |     document.body.appendChild(el);
  46  |   }, title);
  47  | 
  48  |   await pause(page, 1800);
  49  | }
  50  | 
  51  | export async function removeDemoTitle(page: Page) {
  52  |   await page.evaluate(() => {
  53  |     document.getElementById('demo-overlay-title')?.remove();
  54  |   });
  55  | }
  56  | 
  57  | export async function highlightText(page: Page, text: string) {
  58  |   const item = page.getByText(new RegExp(text, 'i')).first();
  59  |   await expect(item).toBeVisible({ timeout: 10_000 }).catch(() => {});
  60  |   await item.hover().catch(() => {});
  61  |   await pause(page, 1200);
  62  | }
  63  | 
  64  | // Handle authentication - SmartCRM uses Supabase auth
  65  | export async function handleAuth(page: Page) {
  66  |   // Check if we're on login page
  67  |   const loginForm = page.locator('form').filter({ hasText: /login|sign in/i });
  68  |   if (await loginForm.isVisible().catch(() => false)) {
  69  |     // Handle login flow - this may need customization based on auth setup
  70  |     console.log('Login form detected - authentication may be required');
  71  |     await pause(page, 2000);
  72  |   }
  73  | }
  74  | 
  75  | // Wait for iframe to load and be ready
  76  | export async function waitForIframeLoad(page: Page, selector = 'iframe') {
  77  |   const iframe = page.locator(selector).first();
  78  |   await expect(iframe).toBeVisible({ timeout: 15_000 });
  79  |   await iframe.waitFor({ state: 'attached' });
  80  |   await pause(page, 3000); // Extra time for iframe content to initialize
  81  | }
  82  | 
  83  | // Switch context to iframe for interactions
  84  | export async function switchToIframe(page: Page, selector = 'iframe') {
  85  |   const frame = page.frameLocator(selector);
  86  |   return frame;
  87  | }
  88  | 
  89  | // Handle iframe-based remote app demos
  90  | export async function handleIframeDemo(page: Page, appName: string, url: string) {
  91  |   await demoTitle(page, `${appName} - Remote Application`);
  92  |   await waitForIframeLoad(page);
  93  | 
  94  |   // For iframe apps, we can still overlay titles and do basic interactions
  95  |   // Note: Cross-origin limitations may prevent deep iframe interactions
  96  |   await pause(page, 2000);
  97  | 
  98  |   await demoTitle(page, `Demonstrating ${appName} features...`);
  99  |   await pause(page, 4000); // Allow time to show the remote app
  100 | }
  101 | 
  102 | // Create sample contact data for demos
  103 | export async function createSampleContact(page: Page) {
  104 |   // This would trigger contact creation - implementation depends on UI
  105 |   const addButton = page.getByRole('button', { name: /add.*contact|new.*contact/i }).first();
  106 |   if (await addButton.isVisible().catch(() => false)) {
  107 |     await addButton.click();
  108 |     await pause(page, 1000);
```