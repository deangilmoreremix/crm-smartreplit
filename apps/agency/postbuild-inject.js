#!/usr/bin/env node

/**
 * Post-build injector for federation-rewritten apps.
 *
 * The @module-federation/vite plugin replaces the app's entry script with
 * its mf-entry-bootstrap. This script restores the real app bundle so the
 * remote renders when loaded standalone (not embedded in a host CRM).
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function injectEntry(distDir) {
  const htmlPath = join(distDir, 'index.html');
  let html = readFileSync(htmlPath, 'utf-8');

  // Find the app's built entry bundle (index.[hash].js) in assets/
  const assetsDir = join(distDir, 'assets');
  let entryFile = null;
  try {
    const files = readdirSync(assetsDir);
    // Prefer index.[hash].js that is NOT remoteEntry, bootstrap, or hostInit
    entryFile = files.find(f =>
      f.startsWith('index.') &&
      f.endsWith('.js') &&
      !f.includes('remoteEntry') &&
      !f.includes('bootstrap') &&
      !f.includes('hostInit') &&
      !f.includes('mf-entry')
    ) || null;
  } catch {
    // assets dir may not exist yet
  }

  if (!entryFile) {
    console.warn(`[postbuild-inject] ${distDir}: no index.[hash].js found, skipping`);
    return;
  }

  const scriptSrc = `/assets/${entryFile}`;

  // Remove any previously injected entry scripts (src="/src/main.tsx" or old asset paths)
  html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/index\.[^"]+\.js"><\/script>/g, '');

  // Inject before </body>
  const injection = `<script type="module" src="${scriptSrc}"></script>`;
  html = html.replace('</body>', `${injection}</body>`);

  writeFileSync(htmlPath, html);
  console.log(`[postbuild-inject] ${distDir}: injected <script src="${scriptSrc}">`);
}

// Run for the app that owns this script
const distDir = join(__dirname, 'dist');
injectEntry(distDir);
