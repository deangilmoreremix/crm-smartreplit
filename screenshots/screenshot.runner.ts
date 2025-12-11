import { chromium, devices } from "@playwright/test";
import fs from "fs";

type Viewport = { width: number; height: number };
type NavStep =
  | { click: string }
  | { waitFor: string; timeout?: number }
  | { eval: string }
  | { wait: number };

type Shot = {
  label: string;
  selector?: string;
  fullPage?: boolean;
  waitFor?: number;
};

type PageTarget = {
  name: string;
  baseUrl?: string; // SPA entry
  url?: string;     // direct URL (remote apps)
  navigate?: NavStep[];
  shots: Shot[];
};

type Config = {
  outputDir: string;
  defaultWait: number;
  viewports: Record<string, Viewport>;
  themes: ("light" | "dark")[];
  pages: PageTarget[];
};

async function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function runNavSteps(page: any, steps: NavStep[] = []) {
  for (const step of steps) {
    if ("click" in step) {
      await page.click(step.click, { timeout: 15000 });
    } else if ("waitFor" in step) {
      await page.waitForSelector(step.waitFor, { state: "visible", timeout: step.timeout ?? 15000 });
    } else if ("eval" in step) {
      await page.evaluate(step.eval);
      await page.waitForLoadState("networkidle").catch(() => {});
    } else if ("wait" in step) {
      await page.waitForTimeout(step.wait);
    }
  }
}

(async () => {
  const cfg: Config = JSON.parse(fs.readFileSync("shots.targets.json", "utf-8"));
  const browser = await chromium.launch();
  try {
    for (const [vpName, viewport] of Object.entries(cfg.viewports)) {
      for (const theme of cfg.themes) {
        const context = await browser.newContext({
          ...devices["Desktop Chrome"],
          viewport,
          colorScheme: theme,
          ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        for (const target of cfg.pages) {
          console.log(`\n=== ${target.name} (${vpName}/${theme}) ===`);

          if (target.url) {
            // Direct URL (remote apps)
            await page.goto(target.url, { waitUntil: "networkidle", timeout: 30000 });
          } else if (target.baseUrl) {
            // SPA entry + nav steps
            await page.goto(target.baseUrl, { waitUntil: "networkidle", timeout: 30000 });
            // Wait a bit more for SPA to hydrate
            await page.waitForTimeout(3000);
            await runNavSteps(page, target.navigate);
          } else {
            continue;
          }

          for (const shot of target.shots) {
            // Allow additional settling
            await page.waitForTimeout(shot.waitFor ?? cfg.defaultWait);

            const dir = `${cfg.outputDir}/${vpName}__${theme}`;
            await ensureDir(dir);
            const file = `${dir}/${target.name}_${shot.label}.png`;

            if (shot.selector) {
              const el = await page.$(shot.selector);
              if (!el) {
                console.warn(`⚠️  Selector not found: ${shot.selector} (skipping)`);
                continue;
              }
              await el.screenshot({ path: file });
            } else {
              await page.screenshot({ path: file, fullPage: !!shot.fullPage });
            }
            console.log(`✅ ${file}`);
          }
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
})();