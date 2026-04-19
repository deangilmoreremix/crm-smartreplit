# Twenty Repository Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clone and integrate the Twenty CRM repository to access all its features and merge them into the current CRM smartreplit monorepo.

**Architecture:** Clone Twenty as a submodule or subdirectory, then systematically integrate compatible features (contact enrichment, lead scoring, workflows, permissions, white-label) into the existing architecture while maintaining the current Supabase/PostgreSQL backend and React frontend.

**Tech Stack:** TypeScript, React, NestJS, PostgreSQL, Supabase, Nx monorepo tools, Drizzle ORM.

---

### Task 1: Clone Twenty Repository

**Files:**

- Create: `twenty/` (cloned repository)

- [ ] **Step 1: Add Twenty as a git submodule**

```bash
cd /workspace/crm-smartreplit
git submodule add https://github.com/deangilmoreremix/twenty.git twenty
```

- [ ] **Step 2: Initialize and update submodule**

```bash
git submodule init
git submodule update --recursive
```

- [ ] **Step 3: Verify submodule structure**

Run: `ls -la twenty/`
Expected: Should see Twenty's source files and directories

- [ ] **Step 4: Commit submodule addition**

```bash
git add .gitmodules twenty/
git commit -m "feat: add Twenty CRM repository as submodule for feature integration"
```

---

### Task 2: Assess Current CRM Architecture

**Files:**

- Read: `package.json`
- Read: `twenty/package.json`
- Read: `twenty/nx.json`
- Read: `AGENTS.md`

- [ ] **Step 1: Examine current repo structure**

Run: `find . -name "*.json" -o -name "*.md" | head -20`
Expected: See current configuration files

- [ ] **Step 2: Compare package.json files**

Run: `diff package.json twenty/package.json`
Expected: See dependency differences

- [ ] **Step 3: Check Nx configuration in Twenty**

Run: `cat twenty/nx.json | head -50`
Expected: See monorepo configuration

- [ ] **Step 4: Document current architecture**

Create notes on current setup vs Twenty's architecture

---

### Task 3: Identify Compatible Features

**Files:**

- Read: `twenty/packages/*/README.md`
- Read: `twenty/packages/twenty-*/src/**/*.ts`
- Create: `docs/superpowers/plans/twenty-feature-mapping.md`

- [ ] **Step 1: List Twenty's packages**

Run: `ls twenty/packages/`
Expected: See all Twenty packages

- [ ] **Step 2: Examine core CRM features**

Run: `find twenty/packages -name "*contact*" -o -name "*workflow*" -o -name "*permission*" | head -10`
Expected: Feature directories

- [ ] **Step 3: Check white-label implementation**

Run: `grep -r "white.*label\|brand" twenty/packages/ --include="*.ts" | head -10`
Expected: Branding code locations

- [ ] **Step 4: Document feature mapping**

Create feature compatibility matrix between current CRM and Twenty

---

### Task 4: Plan Integration Strategy

**Files:**

- Create: `docs/superpowers/specs/twenty-integration-spec.md`

- [ ] **Step 1: Analyze database schemas**

Compare current schema with Twenty's schema files

- [ ] **Step 2: Identify API endpoints to merge**

List REST endpoints that need integration

- [ ] **Step 3: Plan frontend component integration**

Map React components to merge

- [ ] **Step 4: Create integration specification**

Document which features to integrate and how

---

### Task 5: Setup Integration Environment

**Files:**

- Modify: `package.json` (add Twenty dependencies)
- Create: `scripts/integrate-twenty.js`

- [ ] **Step 1: Install Twenty's dependencies**

Run: `npm install` in twenty directory
Expected: Dependencies installed

- [ ] **Step 2: Check for dependency conflicts**

Compare package.json files for conflicts

- [ ] **Step 3: Create integration script**

Write Node.js script to handle integration tasks

- [ ] **Step 4: Test environment setup**

Verify both repos can run independently

---

### Task 6: Implement Contact Enrichment Feature

**Files:**

- Create: `server/contacts/enrichment.ts`
- Modify: `shared/schema.ts`
- Create: `packages/contacts/src/features/enrichment/`

- [ ] **Step 1: Extract Twenty's enrichment logic**

Copy enrichment code from twenty/packages/twenty-contacts/

- [ ] **Step 2: Adapt database schema**

Add enrichment fields to current contacts table

- [ ] **Step 3: Create enrichment API endpoint**

Implement POST /api/contacts/:id/enrich endpoint

- [ ] **Step 4: Add frontend integration**

Create enrichment UI components

---

### Task 7: Implement Lead Scoring Feature

**Files:**

- Create: `server/contacts/scoring.ts`
- Modify: `shared/schema.ts`
- Create: `packages/contacts/src/features/scoring/`

- [ ] **Step 1: Extract scoring algorithms**

Copy AI scoring logic from Twenty

- [ ] **Step 2: Add scoring fields to schema**

Extend contacts table with ai_score, lead_score fields

- [ ] **Step 3: Create scoring API**

Implement POST /api/contacts/:id/score endpoint

- [ ] **Step 4: Integrate scoring UI**

Add scoring display to contact cards

---

### Task 8: Implement Workflow Automation

**Files:**

- Create: `server/workflows/`
- Create: `packages/workflows/src/`
- Modify: `shared/schema.ts`

- [ ] **Step 1: Extract workflow engine**

Copy Twenty's workflow system

- [ ] **Step 2: Setup workflow database tables**

Create triggers, actions, workflows tables

- [ ] **Step 3: Create workflow API endpoints**

Implement CRUD operations for workflows

- [ ] **Step 4: Add workflow builder UI**

Create visual workflow editor

---

### Task 9: Implement Permission System

**Files:**

- Create: `server/auth/permissions.ts`
- Modify: `shared/schema.ts`
- Create: `packages/auth/src/features/permissions/`

- [ ] **Step 1: Extract RBAC logic**

Copy role-based access control from Twenty

- [ ] **Step 2: Create permission tables**

Add roles, permissions, user_roles tables

- [ ] **Step 3: Implement permission middleware**

Create authorization guards

- [ ] **Step 4: Add role management UI**

Create admin interface for roles

---

### Task 10: Implement White-Label System

**Files:**

- Create: `server/white-label/`
- Modify: `shared/schema.ts`
- Create: `packages/ui/src/features/white-label/`

- [ ] **Step 1: Extract branding system**

Copy Twenty's white-label implementation

- [ ] **Step 2: Create tenant branding tables**

Add tenant_config, branding tables

- [ ] **Step 3: Implement branding API**

Create endpoints for theme management

- [ ] **Step 4: Add branding UI**

Create theme customization interface

---

### Task 11: Update Build Configuration

**Files:**

- Modify: `package.json`
- Create: `nx.json` (if adopting Nx)
- Modify: `vite.config.js`

- [ ] **Step 1: Configure Nx workspace**

Setup Nx for monorepo management

- [ ] **Step 2: Update build scripts**

Add Twenty-compatible build commands

- [ ] **Step 3: Configure module federation**

Setup shared modules between apps

- [ ] **Step 4: Test build process**

Verify all packages build correctly

---

### Task 12: Testing and Verification

**Files:**

- Create: `tests/integration/twenty-features.test.ts`
- Modify: `vitest.config.js`

- [ ] **Step 1: Write integration tests**

Create tests for merged features

- [ ] **Step 2: Test contact enrichment**

Verify enrichment API works

- [ ] **Step 3: Test lead scoring**

Verify scoring calculations

- [ ] **Step 4: Test permissions**

Verify role-based access

- [ ] **Step 5: Test white-label**

Verify branding customization

---

### Task 13: Documentation Update

**Files:**

- Modify: `README.md`
- Create: `docs/twenty-integration.md`
- Update: `AGENTS.md`

- [ ] **Step 1: Update main README**

Document new features

- [ ] **Step 2: Create integration guide**

Document how features were merged

- [ ] **Step 3: Update agent documentation**

Note Twenty feature additions

- [ ] **Step 4: Create migration guide**

Document database changes

---

### Task 14: Final Verification

**Files:**

- Create: `scripts/verify-integration.js`

- [ ] **Step 1: Run full test suite**

Execute all tests

- [ ] **Step 2: Test end-to-end workflows**

Verify complete user journeys

- [ ] **Step 3: Performance testing**

Check integration performance

- [ ] **Step 4: Final commit**

Commit all integration changes
