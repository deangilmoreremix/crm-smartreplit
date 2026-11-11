import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { APP_ROUTES } from '../appLinks';

const SRC = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

// All <Route path="..."> patterns declared in App.tsx and the route fragments it spreads in.
const routeSources = ['App.tsx', ...fs.readdirSync(path.join(SRC, 'routes')).map((f) => `routes/${f}`)];
const routePatterns = routeSources
  .flatMap((f) => Array.from(read(f).matchAll(/<Route\s+path=\{?["'`]([^"'`]+)["'`]/g)).map((m) => m[1]))
  .filter((p) => p.startsWith('/') && p !== '*');
// Multi-line <Route\n path="..."> declarations.
const multiline = routeSources.flatMap((f) =>
  Array.from(read(f).matchAll(/^\s+path=["']([^"']+)["']/gm)).map((m) => m[1])
);
const allPatterns = Array.from(new Set([...routePatterns, ...multiline.filter((p) => p.startsWith('/'))]));

const toRegex = (pattern: string) =>
  new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === ':' ? c : '\\' + c)).replace(/:[A-Za-z0-9_]+/g, '[^/]+') + '/?$');
const routeRegexes = allPatterns.map(toRegex);
const resolves = (p: string) => routeRegexes.some((r) => r.test(p));

// Navigation links that are known not to resolve yet (outside this change's scope).
const KNOWN_UNRESOLVED = new Set([
  '/analytics/kpi',
  '/analytics/tasks',
  '/analytics/revenue',
  '/analytics/productivity',
  '/analytics/insights',
  '/business-analytics',
  '/business-analytics/kpi',
  '/business-analytics/deals',
  '/business-analytics/contacts',
  '/business-analytics/tasks',
  '/business-analytics/revenue',
  '/business-analytics/productivity',
  '/business-analytics/insights',
]);

describe('APP_ROUTES', () => {
  it('has every path resolving to a <Route> in App.tsx', () => {
    const unresolved = Object.values(APP_ROUTES).filter((p) => !resolves(p));
    expect(unresolved, `Unresolved paths: ${unresolved.join(', ')}`).toEqual([]);
  });

  it('covers every internal link literal in Navbar, CommandMenu, GlobalShortcuts and onboarding', () => {
    const known = new Set<string>(Object.values(APP_ROUTES));
    const files = [
      'components/Navbar.tsx',
      'components/CommandMenu/CommandMenu.tsx',
      'components/GlobalShortcuts.tsx',
      'hooks/useOnboarding.ts',
    ];
    const missing: string[] = [];
    for (const f of files) {
      for (const m of read(f).matchAll(/['"`](\/[a-z][A-Za-z0-9\-_/:]*)(?:\?[^'"`]*)?['"`]/g)) {
        const p = m[1];
        if (p.endsWith('/') || p.startsWith('/api/') || p === '/api') continue;
        if (known.has(p) || KNOWN_UNRESOLVED.has(p)) continue;
        // `/contacts/${id}` style template literals are excluded by the character class above.
        missing.push(`${f}: ${p}`);
      }
    }
    expect(missing, `Links missing from APP_ROUTES: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps the documented known-unresolved list honest', () => {
    const nowResolving = Array.from(KNOWN_UNRESOLVED).filter(resolves);
    expect(nowResolving, `Remove from KNOWN_UNRESOLVED: ${nowResolving.join(', ')}`).toEqual([]);
  });
});
