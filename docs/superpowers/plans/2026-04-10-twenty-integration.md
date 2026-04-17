# Twenty Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Twenty CRM codebase into the existing crm-smartreplit application to combine CRM features.

**Architecture:** Add Twenty packages to the monorepo, merge server APIs using a hybrid Express/NestJS setup, integrate databases with shared PostgreSQL schema, unify frontend with shared UI components.

**Tech Stack:** TypeScript, React, Express/NestJS, Drizzle/TypeORM, PostgreSQL, Supabase, Tailwind/Mantine.

---

### Task 1: Set up Nx workspace for monorepo management

**Files:**

- Create: nx.json
- Modify: package.json (add Nx scripts)
- Create: packages/twenty-server, packages/twenty-front, etc.

- [ ] **Step 1: Install Nx**

Install Nx as dev dependency.

```bash
npm install -D nx
```

- [ ] **Step 2: Initialize Nx workspace**

```bash
npx nx init
```

- [ ] **Step 3: Update package.json scripts**

Add Nx scripts for build, test, etc.

- [ ] **Step 4: Commit Nx setup**

```bash
git add . && git commit -m "feat: set up Nx workspace for Twenty integration"
```

### Task 2: Clone and integrate Twenty packages

**Files:**

- Create: packages/twenty-server/
- Create: packages/twenty-front/
- Create: packages/twenty-shared/
- Create: packages/twenty-ui/

- [ ] **Step 1: Clone Twenty repository**

Clone into temporary directory.

```bash
git clone https://github.com/twentyhq/twenty.git /tmp/twenty
```

- [ ] **Step 2: Copy Twenty packages**

Copy packages/twenty-\* to packages/

```bash
cp -r /tmp/twenty/packages/twenty-* packages/
```

- [ ] **Step 3: Update package names to avoid conflicts**

Rename packages to @crm/twenty-\* or something.

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

- [ ] **Step 5: Commit package integration**

```bash
git add packages/twenty-* && git commit -m "feat: integrate Twenty packages into monorepo"
```

### Task 3: Integrate database schemas

**Files:**

- Modify: drizzle.config.ts (add Twenty schemas)
- Create: server/twenty-migrations/

- [ ] **Step 1: Analyze Twenty database schema**

Examine TypeORM entities in twenty-server.

- [ ] **Step 2: Convert TypeORM to Drizzle**

Convert Twenty entities to Drizzle schema files.

- [ ] **Step 3: Merge schemas**

Combine with existing Drizzle schemas.

- [ ] **Step 4: Update migrations**

Create new migrations for merged schema.

- [ ] **Step 5: Commit database integration**

```bash
git add . && git commit -m "feat: integrate Twenty database schemas"
```

### Task 4: Merge server APIs

**Files:**

- Modify: server/index.ts (add GraphQL endpoint)
- Create: server/twenty-apis/

- [ ] **Step 1: Set up NestJS in Express app**

Install @nestjs/core, etc., and bootstrap NestJS in Express.

- [ ] **Step 2: Move Twenty server modules**

Copy Twenty GraphQL modules to server/twenty-apis/

- [ ] **Step 3: Integrate authentication**

Merge auth systems (Supabase + Twenty auth).

- [ ] **Step 4: Update API routes**

Add /graphql endpoint.

- [ ] **Step 5: Commit server integration**

```bash
git add server/ && git commit -m "feat: merge Twenty server APIs"
```

### Task 5: Integrate frontend components

**Files:**

- Modify: client/src/ (add Twenty components)
- Create: client/src/twenty/

- [ ] **Step 1: Install Twenty frontend dependencies**

Add Apollo, Mantine to client package.json.

- [ ] **Step 2: Copy Twenty UI components**

Copy twenty-ui to client/src/twenty/ui/

- [ ] **Step 3: Integrate routing**

Add Twenty routes to existing React Router.

- [ ] **Step 4: Merge UI themes**

Combine Tailwind and Mantine themes.

- [ ] **Step 5: Commit frontend integration**

```bash
git add client/ && git commit -m "feat: integrate Twenty frontend components"
```

### Task 6: Update build and deployment scripts

**Files:**

- Modify: package.json scripts
- Modify: netlify.toml

- [ ] **Step 1: Update build scripts**

Add Nx build commands for Twenty packages.

- [ ] **Step 2: Configure module federation**

Set up shared dependencies between apps.

- [ ] **Step 3: Update deployment config**

Add Twenty functions to Netlify.

- [ ] **Step 4: Test build**

```bash
npm run build
```

- [ ] **Step 5: Commit build updates**

```bash
git add . && git commit -m "feat: update build scripts for Twenty"
```

### Task 7: Testing and validation

**Files:**

- Create: tests/integration/twenty/
- Modify: vitest.config.ts

- [ ] **Step 1: Set up integration tests**

Create tests for merged APIs.

- [ ] **Step 2: Test database migrations**

Run migrations on test DB.

- [ ] **Step 3: Test UI integration**

Check component rendering.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

- [ ] **Step 5: Commit tests**

```bash
git add tests/ && git commit -m "feat: add integration tests for Twenty"
```
