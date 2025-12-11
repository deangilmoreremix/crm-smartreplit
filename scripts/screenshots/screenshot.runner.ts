import fs from 'fs';
import path from 'path';
import { chromium, devices } from '@playwright/test';

type Viewport = { width: number; height: number; };
type Shot = {
  label: string;
  selector?: string;
  fullPage?: boolean;
  waitFor?: number;
};
type PageTarget = {
  name: string;
  url: string;
  shots: Shot[];
};
type Config = {
  outputDir: string;
  defaultWait: number;
  viewports: Record<string, Viewport>;
  themes: ('light'|'dark')[];
  auth: {
    enabled: boolean;
    loginUrl: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
    username: string;
    password: string;
  };
  pages: PageTarget[];
};

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function loginIfNeeded(cfg: Config, page: any) {
  if (!cfg.auth?.enabled) return;
  await page.goto(cfg.auth.loginUrl, { waitUntil: 'networkidle' });
  await page.fill(cfg.auth.usernameSelector, cfg.auth.username);
  await page.fill(cfg.auth.passwordSelector, cfg.auth.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click(cfg.auth.submitSelector),
  ]);
}

async function setTheme(page: any, theme: 'light'|'dark') {
  // If your app reads prefers-color-scheme:
  await page.emulateMedia({ colorScheme: theme });
  // If your app uses a class toggle, you can force it:
  // await page.addStyleTag({content: theme === 'dark' ? ':root { color-scheme: dark; }' : ':root { color-scheme: light; }'});
  // Or expose a window function your app listens to.
}

async function captureOne(
  page: any,
  cfg: Config,
  target: PageTarget,
  shot: Shot,
  outDir: string,
  vpName: string,
  theme: 'light'|'dark'
) {
  await page.goto(target.url, { waitUntil: 'networkidle' });

  // small settle delay
  await page.waitForTimeout(shot.waitFor ?? cfg.defaultWait);

  const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, '_');
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

(async () => {
  const cfg: Config = JSON.parse(fs.readFileSync('shots.targets.json', 'utf-8'));
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
          } catch (e: any) {
            console.warn(`✖ Failed: ${target.name} -> ${shot.label} (${vpName}/${theme})`, e?.message);
          }
        }
      }
    }

    await context.close();
  }
  await browser.close();
})();