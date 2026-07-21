#!/usr/bin/env node

/**
 * Post-build injector for federation-rewritten apps.
 *
 * 1. Restores the real app bundle script tag in dist/index.html
 *    (the @module-federation/vite plugin replaces it with mf-entry-bootstrap).
 * 2. Patches mf-entry-bootstrap-*.js to remove the dynamic import of
 *    the original source entry (../src/main.tsx), which returns HTML
 *    from Netlify and causes a MIME-type error in the browser.
 * 3. Removes ALL stale bootstrap script tags from index.html to avoid
 *    loading old bootstraps from previous deploys.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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

  // Remove any previously injected entry scripts
  html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/index\.[^"]+\.js"><\/script>/g, '');

  // Inject before </body>
  const injection = `<script type="module" src="${scriptSrc}"></script>`;
  html = html.replace('</body>', `${injection}</body>`);

  writeFileSync(htmlPath, html);
  console.log(`[postbuild-inject] ${distDir}: injected <script src="${scriptSrc}">`);
}

function patchBootstrap(distDir) {
  const assetsDir = join(distDir, 'assets');
  try {
    const files = readdirSync(assetsDir);
    const bootstrapFiles = files.filter(f => f.startsWith('mf-entry-bootstrap-') && f.endsWith('.js'));

    if (bootstrapFiles.length > 0) {
      // Patch ALL bootstrap files to remove src/main.tsx dynamic import
      for (const bootstrapFile of bootstrapFiles) {
        const bootstrapPath = join(assetsDir, bootstrapFile);
        let content = readFileSync(bootstrapPath, 'utf-8');

        const original = content;
        content = content.replace(/__mfImport\("\.\.\/src\/main\.tsx"\);/g, '');
        content = content.replace(/__mfImport\('\.\.\/src\/main\.tsx'\);/g, '');

        if (content !== original) {
          writeFileSync(bootstrapPath, content);
          console.log(`[postbuild-inject] ${distDir}: patched ${bootstrapFile} (removed src/main.tsx dynamic import)`);
        } else {
          console.log(`[postbuild-inject] ${distDir}: ${bootstrapFile} already clean`);
        }
      }
    } else {
      console.log(`[postbuild-inject] ${distDir}: no mf-entry-bootstrap found, skipping patch`);
    }

    // Remove ALL bootstrap script tags from index.html (stale ones from previous deploys)
    const htmlPath = join(distDir, 'index.html');
    let html = readFileSync(htmlPath, 'utf-8');
    const before = html;
    html = html.replace(/<script type="module"(?: crossorigin)? src="\/assets\/mf-entry-bootstrap-[^"]+\.js"><\/script>\n?/g, '');

    if (html !== before) {
      writeFileSync(htmlPath, html);
      console.log(`[postbuild-inject] ${distDir}: removed stale bootstrap script tags from HTML`);
    }
  } catch (err) {
    console.warn(`[postbuild-inject] ${distDir}: bootstrap patch failed:`, err.message);
  }
}

// Run for the app that owns this script
const distDir = join(__dirname, 'dist');
injectEntry(distDir);
patchBootstrap(distDir);
