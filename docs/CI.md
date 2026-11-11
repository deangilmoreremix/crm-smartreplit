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

## Client test status

- `npx vitest run server packages` and `npx vitest run client/src` are both hard CI gates (all green,
  no `continue-on-error`, nothing excluded).
- Per-test and per-hook timeouts are set in `vitest.config.ts` (15s) so a stuck async test fails
  instead of stalling the job.
- `client/src/tests/ProtectedRoute.test.tsx` used to hang: its `EntitlementContext` mock was a stub
  object rather than a real React context, so `ProtectedRoute` never saw `isLoading`/`entitlement`
  and rendered `<Navigate>` outside `<Routes>` in an endless redirect loop. The mock now exports a
  real context that the tests provide.
- Browser-console helper scripts live next to the tests as `*.console.js` (not collected by vitest).
