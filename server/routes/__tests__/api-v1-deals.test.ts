/**
 * Regression guards for the PR #5 `/api/v1/deals` findings.
 *
 * These tests assert on the route definitions because the route module uses
 * Node16-style `../../../shared/schema.js` specifiers (this repo pins
 * `moduleResolution: node16`), which the vitest/vite transform cannot resolve to
 * `.ts`. Runtime behaviour is verified separately with `tsx`, which resolves the
 * specifiers correctly.
 *
 *   - P2: `GET /pipeline/summary` was declared *after* `GET /:id`, so the dynamic
 *     route shadowed it and the summary endpoint was unreachable.
 *   - P2: closing a deal only updated `status`, leaving `stage` unset.
 *   - P2: the pipeline summary counted `closed_won` / `closed_lost` while deals
 *     are persisted with the canonical hyphenated `closed-won` / `closed-lost`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(process.cwd(), 'server', 'routes', 'api', 'v1', 'deals.ts'),
  'utf8'
);

const indexOf = (needle: string): number => {
  const index = source.indexOf(needle);
  expect(index, `expected to find ${needle} in deals.ts`).toBeGreaterThan(-1);
  return index;
};

const closeStart = source.indexOf("router.post('/:id/close'");
const closeEnd = source.indexOf('export default router');
const closeHandler = source.slice(closeStart, closeEnd);

const summaryStart = source.indexOf("router.get('/pipeline/summary'");
const summaryEnd = source.indexOf("router.get('/:id'");
const summaryHandler = source.slice(summaryStart, summaryEnd);

describe('PR #5: /api/v1/deals', () => {
  describe('route registration order', () => {
    it('declares /pipeline/summary before the dynamic /:id route', () => {
      expect(indexOf("router.get('/pipeline/summary'")).toBeLessThan(indexOf("router.get('/:id'"));
    });

    it('declares the summary route before the close and stage sub-routes', () => {
      expect(indexOf("router.get('/pipeline/summary'")).toBeLessThan(
        indexOf("router.post('/:id/close'")
      );
      expect(indexOf("router.get('/pipeline/summary'")).toBeLessThan(
        indexOf("router.put('/:id/stage'")
      );
    });
  });

  describe('pipeline summary stage identifiers', () => {
    it('uses the canonical hyphenated closed stage identifiers', () => {
      expect(summaryHandler).toContain("'closed-won'");
      expect(summaryHandler).toContain("'closed-lost'");
    });

    it('does not use the underscore spellings that never match persisted deals', () => {
      expect(summaryHandler).not.toContain("'closed_won'");
      expect(summaryHandler).not.toContain("'closed_lost'");
    });

    it('summarises every canonical stage', () => {
      for (const stage of [
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'closed-won',
        'closed-lost',
      ]) {
        expect(summaryHandler).toContain(`'${stage}'`);
      }
    });
  });

  describe('deal close', () => {
    it('sets both status and the canonical stage when the deal is won', () => {
      expect(closeHandler).toContain("status: won ? 'won' : 'lost'");
      expect(closeHandler).toContain("stage: won ? 'closed-won' : 'closed-lost'");
    });

    it('writes canonical stages that the pipeline summary counts', () => {
      // The stage written on close must be one the summary groups by,
      // otherwise a closed deal disappears from the pipeline report.
      expect(summaryHandler).toContain("'closed-won'");
      expect(summaryHandler).toContain("'closed-lost'");
      expect(closeHandler).toContain("'closed-won'");
      expect(closeHandler).toContain("'closed-lost'");
    });
  });
});
