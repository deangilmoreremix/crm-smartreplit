const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('@playwright/test');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loginIfNeeded(cfg, page) {
  if (!cfg.auth?.enabled) return;
  await page.goto(cfg.auth.loginUrl, { waitUntil: 'networkidle' });
  await page.fill(cfg.auth.usernameSelector, cfg.auth.username);
  await page.fill(cfg.auth.passwordSelector, cfg.auth.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(cfg.auth.submitSelector),
  ]);
}

async function setTheme(page, theme) {
  // If your app reads prefers-color-scheme:
  await page.emulateMedia({ colorScheme: theme });
  // If your app uses a class toggle, you can force it:
  // await page.addStyleTag({content: theme === 'dark' ? ':root { color-scheme: dark; }' : ':root { color-scheme: light; }'});
  // Or expose a window function your app listens to.
}

async function captureOne(page, cfg, target, shot, outDir, vpName, theme) {
  await page.goto(target.url, { waitUntil: 'networkidle' });

  // small settle delay
  await page.waitForTimeout(shot.waitFor ?? cfg.defaultWait);

  const safe = (s) => s.replace(/[^a-z0-9_-]/gi, '_');
  const file = path.join(
    outDir,
    `${safe(target.name)}__${safe(shot.label)}__${vpName}__${theme}.png`
  );

  if (shot.fullPage) {
    await page.screenshot({ path: file, fullPage: true });
  } else if (shot.selector) {
    const el = await page.locator(shot.selector).first();
    await el.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file });
  }

  console.log('✔', file);
}

async function runScreenshotCapture() {
  const cfg = JSON.parse(fs.readFileSync('shots.targets.json', 'utf-8'));
  const outRoot = path.resolve(cfg.outputDir);
  await ensureDir(outRoot);

  const browser = await chromium.launch();
  for (const [vpName, viewport] of Object.entries(cfg.viewports)) {
    const context = await browser.newContext({
      viewport,
      userAgent:
        vpName === 'mobile'
          ? devices['iPhone 12'].userAgent
          : undefined
    });

    const page = await context.newPage();

    // optional login once per viewport/theme set
    await loginIfNeeded(cfg, page);

    for (const theme of cfg.themes) {
      await setTheme(page, theme);
      const outDir = path.join(outRoot, `${vpName}__${theme}`);
      await ensureDir(outDir);

      for (const target of cfg.pages) {
        for (const shot of target.shots) {
          try {
            await captureOne(page, cfg, target, shot, outDir, vpName, theme);
          } catch (e) {
            console.warn(`✖ Failed: ${target.name} -> ${shot.label} (${vpName}/${theme})`, e?.message);
          }
        }
      }
    }

    await context.close();
  }
  await browser.close();
  console.log('🎉 Screenshot capture complete!');
}

runScreenshotCapture().catch(console.error);