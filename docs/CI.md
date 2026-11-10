# CI gates

Stack: GitHub Actions (for Netlify), Netlify, Supabase, OpenAI. Nothing else.

**Use pnpm, not npm.** Packages use `workspace:*`, which `npm install` cannot resolve. Run `corepack enable && pnpm install`.

## `.github/workflows/ci.yml` (PRs and pushes to main)

1. Type-check ratchet, server: `node scripts/typecheck-ratchet.mjs --target server`
2. Type-check ratchet, client: `node scripts/typecheck-ratchet.mjs --target client`
3. `npx vitest run`
4. `npm run build` (Vite client + Netlify functions + `scripts/verify-dist.mjs`), with dummy `VITE_SUPABASE_*` values.

## Type-check ratchet

The client had ~1,000 pre-existing type errors, so a plain `tsc` gate would be permanently red. The ratchet runs `tsc`, reduces each error to `file: TScode` (line/column dropped) and compares per-pair counts with a committed baseline:

- client: `scripts/typecheck-baseline.txt`
- server: `scripts/typecheck-baseline-server.txt`

It fails only if some `file + code` count increases or a new pair appears. Fixing errors never fails it.

Update a baseline after fixing errors (to lock in the gain) or after a merge that changes it:

```
node scripts/typecheck-ratchet.mjs --target client --update
node scripts/typecheck-ratchet.mjs --target server --update
```

Commit the baseline files. Never update a baseline to hide new errors.

Notes: `npm run typecheck` runs both ratchets; `typecheck:client` / `typecheck:server` run raw `tsc` (they list every error). The root `tsconfig.json` only covers root-level `*.ts` config files; `server/` is excluded from it.

## `.github/workflows/netlify-preview.yml`

Runs `npx netlify-cli deploy --build` for a draft preview and comments the URL on the PR. Needs repo secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`; skipped when they are missing (including fork PRs). Runtime env vars come from the Netlify site settings.

## Client test status (known)

- `npx vitest run server packages` is a hard CI gate (all green).
- Client tests run as informational (`continue-on-error`). About 14 client test files were already
  failing before the AI/Twenty work: ErrorBoundary, ai/BatchOperations, ai/SmartAIControls,
  EnhancedContactCard, LeadScoringVisualization, mfe/loadRemoteEntry, services/__tests__ (5),
  shared/EventBus, tests/Login, tests/contacts.
- `client/src/tests/ProtectedRoute.test.tsx` hangs (infinite wait) on the base branch too and is
  excluded in CI; it exhausts memory when run with the whole suite.
