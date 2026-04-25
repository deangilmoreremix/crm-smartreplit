# Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from Neon PostgreSQL to Supabase database, removing all Neon dependencies while maintaining existing functionality.

**Architecture:** Replace Neon-specific database adapter with standard PostgreSQL connection, update environment variables to use Supabase credentials, remove Neon packages, and rebuild Netlify functions.

**Tech Stack:** Drizzle ORM, PostgreSQL, Supabase, Node.js, Netlify Functions

---

### Task 1: Update Client Environment Variables

**Files:**

- Modify: `client/.env`

- [ ] **Step 1: Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY**

Replace the existing values with the new Supabase credentials:

```
VITE_SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A
```

- [ ] **Step 2: Commit client environment changes**

```bash
git add client/.env
git commit -m "feat: update client Supabase environment variables"
```

### Task 2: Update Server Database Connection

**Files:**

- Modify: `server/db.ts`

- [ ] **Step 1: Replace Neon imports with PostgreSQL imports**

Change the imports in `server/db.ts`:

```typescript
// Remove these lines:
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Add these lines:
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
```

- [ ] **Step 2: Remove Neon WebSocket configuration**

Remove the `neonConfig.webSocketConstructor = ws;` line from `server/db.ts`.

- [ ] **Step 3: Update database connection to use postgres-js**

Replace the Pool initialization:

```typescript
// Replace this:
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
export const db = pool ? drizzle({ client: pool, schema }) : null;

// With this:
const client = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL) : null;
export const db = client ? drizzle({ client, schema }) : null;
export const pool = null; // Keep for compatibility if needed
```

- [ ] **Step 4: Commit database connection changes**

```bash
git add server/db.ts
git commit -m "feat: migrate database connection from Neon to Supabase PostgreSQL"
```

### Task 3: Update Netlify Environment Variables

**Files:**

- N/A (uses Netlify CLI)

- [ ] **Step 1: Set DATABASE_URL in Netlify environment**

Use Netlify CLI to update the DATABASE_URL:

```bash
netlify env:set DATABASE_URL postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres
```

- [ ] **Step 2: Set SUPABASE_SERVICE_ROLE_KEY in Netlify environment**

```bash
netlify env:set SUPABASE_SERVICE_ROLE_KEY eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE
```

- [ ] **Step 3: Verify environment variables are set**

```bash
netlify env:list
```

Expected: Shows the updated DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY

- [ ] **Step 4: Commit environment documentation**

Create a note in the commit message about Netlify env changes:

```bash
git commit --allow-empty -m "docs: updated Netlify environment variables for Supabase migration

DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY set via Netlify CLI"
```

### Task 4: Remove Neon Dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Remove @neondatabase/serverless from dependencies**

Edit `package.json` to remove the Neon package:

```json
{
  "dependencies": {
    // Remove this line:
    // "@neondatabase/serverless": "^0.10.4",
  }
}
```

- [ ] **Step 2: Remove ws dependency if only used for Neon**

Check if `ws` is used elsewhere. If not, remove it:

```json
{
  "dependencies": {
    // Remove this line if not used elsewhere:
    // "ws": "^8.18.0",
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

- [ ] **Step 4: Commit dependency changes**

```bash
git add package.json package-lock.json
git commit -m "feat: remove Neon dependencies from package.json"
```

### Task 5: Install Supabase SSR Package

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add @supabase/ssr to dependencies**

Add the package for enhanced Supabase server-side support:

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.1"
  }
}
```

- [ ] **Step 2: Install the new dependency**

```bash
npm install
```

- [ ] **Step 3: Commit SSR package addition**

```bash
git add package.json package-lock.json
git commit -m "feat: add @supabase/ssr package for enhanced server support"
```

### Task 6: Rebuild Netlify Functions

**Files:**

- N/A (build process)

- [ ] **Step 1: Clean previous builds**

```bash
rm -rf netlify/functions/health/*.mjs
rm -rf netlify/functions/partners/*.mjs
rm -rf netlify/functions/openai/*.mjs
rm -rf netlify/functions/users/*.mjs
rm -rf netlify/functions/messaging/*.mjs
rm -rf netlify/functions/white-label/*.mjs
rm -rf netlify/functions/auth/*.mjs
rm -rf netlify/functions/entitlements/*.mjs
rm -rf netlify/functions/ai-proxy/*.mjs
```

- [ ] **Step 2: Rebuild all functions**

```bash
npm run build:functions
```

- [ ] **Step 3: Verify functions were built without errors**

Check that the .mjs files were created in netlify/functions/ directories

- [ ] **Step 4: Commit rebuilt functions**

```bash
git add netlify/functions/
git commit -m "feat: rebuild Netlify functions after Neon removal"
```

### Task 7: Test Database Connection

**Files:**

- Test: Server startup and database queries

- [ ] **Step 1: Start the development server**

```bash
npm run dev
```

- [ ] **Step 2: Verify server starts without Neon-related errors**

Check console output for any import errors or connection failures

- [ ] **Step 3: Test a simple database query**

Make a request to an endpoint that uses the database (e.g., contacts API)

- [ ] **Step 4: Commit successful test results**

```bash
git commit --allow-empty -m "test: verified database connection works with Supabase

Server starts successfully and database queries execute without errors"
```

### Task 8: Run Full Test Suite

**Files:**

- Test: All existing tests

- [ ] **Step 1: Run the test suite**

```bash
npm test
```

- [ ] **Step 2: Verify all tests pass**

Check that no tests fail due to database connection changes

- [ ] **Step 3: Commit test verification**

```bash
git commit --allow-empty -m "test: all tests pass after Supabase migration"
```

### Task 9: Deploy and Verify Production

**Files:**

- N/A (deployment)

- [ ] **Step 1: Deploy to Netlify**

```bash
netlify deploy --prod
```

- [ ] **Step 2: Test production database connection**

Access the deployed app and verify database operations work

- [ ] **Step 3: Commit deployment verification**

```bash
git tag -a v1.0.0-supabase-migration -m "Supabase migration complete"
git push origin main --tags
```
