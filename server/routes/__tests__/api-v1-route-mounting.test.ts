/**
 * Regression guards for the PR #5 v1 router mounting.
 *
 * `server/routes/api/v1/contacts.ts` and `deals.ts` existed with real CRUD
 * handlers, but `registerRoutes` never imported or mounted them, so
 * `/api/v1/contacts` and `/api/v1/deals` were unreachable at runtime.
 *
 * The route modules use Node16-style `shared/schema.js` specifiers (this repo
 * pins `moduleResolution: node16`), which the vitest transform cannot resolve to
 * `.ts`, so these assertions read the route registry source instead of importing
 * the routers. Runtime mounting is verified separately with `tsx`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routesIndexSource = readFileSync(join(process.cwd(), 'server', 'routes', 'index.ts'), 'utf8');

describe('PR #5: /api/v1 router mounting', () => {
  it('imports the v1 contacts and deals routers', () => {
    expect(routesIndexSource).toMatch(/import\s+contactsRouter\s+from\s+'\.\/api\/v1\/contacts'/);
    expect(routesIndexSource).toMatch(/import\s+dealsRouter\s+from\s+'\.\/api\/v1\/deals'/);
  });

  it('mounts them under /api/v1/contacts and /api/v1/deals', () => {
    expect(routesIndexSource).toMatch(
      /app\.use\(\s*'\/api\/v1\/contacts'\s*,\s*contactsRouter\s*\)/
    );
    expect(routesIndexSource).toMatch(/app\.use\(\s*'\/api\/v1\/deals'\s*,\s*dealsRouter\s*\)/);
  });

  it('mounts them inside registerRoutes, not at module scope', () => {
    const declaration = 'function registerRoutes';
    expect(routesIndexSource).toContain(declaration);
    const registerBody = routesIndexSource.slice(routesIndexSource.indexOf(declaration));

    expect(registerBody).toMatch(/app\.use\(\s*'\/api\/v1\/contacts'/);
    expect(registerBody).toMatch(/app\.use\(\s*'\/api\/v1\/deals'/);
  });

  it('mounts them alongside the other api routes (not before auth wiring)', () => {
    const registerBody = routesIndexSource.slice(
      routesIndexSource.indexOf('function registerRoutes')
    );
    // Sanity check that registerBody really is the registerRoutes body.
    expect(registerBody).toMatch(/app\.use\(\s*'\/api\/auth'\s*,\s*authRoutes\s*\)/);
    expect(registerBody).toMatch(/app\.use\(\s*'\/api\/v1\/contacts'\s*,\s*contactsRouter\s*\)/);
    expect(registerBody).toMatch(/app\.use\(\s*'\/api\/v1\/deals'\s*,\s*dealsRouter\s*\)/);
  });
});
