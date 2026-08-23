#!/usr/bin/env node

/**
 * Post-build injector for federation-rewritten apps.
 *
 * The @module-federation/vite plugin replaces the app's entry with
 * mf-entry-bootstrap. This script:
 * 1. Patches the bootstrap to remove the src/main.tsx dynamic import
 *    (Netlify serves that as HTML, causing MIME errors)
 * 2. Keeps ONE bootstrap script tag (the federation runtime init)
 * 3. Injects the real app entry script AFTER the bootstrap
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findAppEntry(assetsDir) {
  const files = readdirSync(assetsDir);
  // Prefer index-[hash].js (the actual app entry with createRoot)
  let entryFile = files.find(f =>
    f.startsWith('index-') &&
    f.endsWith('.js') &&
    !f.includes('remoteEntry') &&
    !f.includes('bootstrap') &&
    !f.includes('hostInit') &&
    !f.includes('mf-entry')
  );
  // Fallback to app-specific bundle
  if (!entryFile) {
    const prefixes = ['AgencyApp', 'AnalyticsApp', 'MultiAnalyticsApp', 'ContactsApp', 'PipelineApp', 'CalendarApp'];
    for (const prefix of prefixes) {
      entryFile = files.find(f =>
        f.startsWith(`${prefix}.`) &&
        f.endsWith('.js') &&
        !f.includes('remoteEntry') &&
        !f.includes('bootstrap') &&
        !f.includes('hostInit') &&
        !f.includes('mf-entry')
      );
      if (entryFile) break;
    }
  }
  // Last fallback: generic index.[hash].js
  if (!entryFile) {
    entryFile = files.find(f =>
      f.startsWith('index.') &&
      f.endsWith('.js') &&
      !f.includes('remoteEntry') &&
      !f.includes('bootstrap') &&
      !f.includes('hostInit') &&
      !f.includes('mf-entry')
    ) || null;
  }
  return entryFile;
}

function injectEntry(distDir) {
  const htmlPath = join(distDir, 'index.html');
  let html = readFileSync(htmlPath, 'utf-8');

  const assetsDir = join(distDir, 'assets');
  let entryFile = null;
  try {
    entryFile = findAppEntry(assetsDir);
  } catch {
    // assets dir may not exist yet
  }

  if (!entryFile) {
    console.warn(`[postbuild-inject] ${distDir}: no app bundle found, skipping`);
    return;
  }

  const scriptSrc = `/assets/${entryFile}`;

  // Remove any previously injected entry scripts (keep bootstrap tags)
  html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/index\.[^"]+\.js"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/AgencyApp\.[^"]+\.js"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/AnalyticsApp\.[^"]+\.js"><\/script>/g, '');
  html = html.replace(/<script type="module" src="\/assets\/MultiAnalyticsApp\.[^"]+\.js"><\/script>/g, '');

  // Inject the app entry AFTER any bootstrap (before </body>, but after existing scripts)
  const injection = `<script type="module" src="${scriptSrc}"></script>`;
  // Insert after the last script tag or before </body>
  html = html.replace('</body>', `${injection}</body>`);

  writeFileSync(htmlPath, html);
  console.log(`[postbuild-inject] ${distDir}: injected <script src="${scriptSrc}">`);
}

function patchBootstrap(distDir) {
  const assetsDir = join(distDir, 'assets');
  try {
    const files = readdirSync(assetsDir);
    const bootstrapFiles = files.filter(f => f.startsWith('mf-entry-bootstrap-') && f.endsWith('.js'));

    if (bootstrapFiles.length === 0) {
      console.log(`[postbuild-inject] ${distDir}: no mf-entry-bootstrap found, skipping patch`);
      return;
    }

    // Keep only the latest bootstrap, remove older ones from HTML
    const sortedByMtime = bootstrapFiles
      .map(f => ({ name: f, mtime: statSync(join(assetsDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    const latestBootstrap = sortedByMtime[0].name;

    // Remove ALL bootstrap script tags from HTML, then re-add only the latest
    const htmlPath = join(distDir, 'index.html');
    let html = readFileSync(htmlPath, 'utf-8');
    html = html.replace(/<script[^>]*mf-entry-bootstrap[^>]*><\/script>\n?/g, '');
    const latestScriptTag = `<script type="module" crossorigin src="/assets/${latestBootstrap}"></script>`;
    // Insert bootstrap BEFORE the first existing script tag (runs first to init federation runtime)
    if (html.includes('<script')) {
      html = html.replace('<script', `${latestScriptTag}<script`);
    } else {
      html = html.replace('</body>', `${latestScriptTag}</body>`);
    }
    writeFileSync(htmlPath, html);
    console.log(`[postbuild-inject] ${distDir}: inserted ${latestBootstrap} before app scripts`);

    // Patch ALL bootstrap files to remove src/main.tsx dynamic import
    for (const { name: bootstrapFile } of sortedByMtime) {
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
  } catch (err) {
    console.warn(`[postbuild-inject] ${distDir}: bootstrap patch failed:`, err.message);
  }
}

const distDir = join(__dirname, 'dist');
injectEntry(distDir);
patchBootstrap(distDir);
