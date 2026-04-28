# Update Netlify URLs to SmartCRM VIP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all netlify.app URLs with corresponding smartcrm.vip domains in specified component and service files to migrate from separate Netlify deployments to smartcrm.vip domain.

**Architecture:** Perform systematic find-and-replace operations across 35+ files, updating URL constants, iframe sources, and service endpoints. The main app loads remote module federation apps from these domains, so all references must be updated for proper loading.

**Tech Stack:** JavaScript/TypeScript, React components, service files, module federation.

---

## File Structure

- **Remote Loader Components:** Components responsible for loading remote apps via module federation (RemoteContactsLoader, RemoteAnalyticsLoader, etc.)
- **Page Components:** Pages that integrate remote content (EnhancedDashboard, ContactsWithRemote, etc.)
- **Service Files:** Backend service bridges (remoteContactsBridge, remoteAppHealthService)
- **Contacts Components:** Specialized contact-related remote integrations
- **Other Components:** Utility components like IframeOverlapDetector, DevBypassButton
- **Security Middleware:** Files handling CORS or domain allowlists (to be identified)

Each file contains hardcoded URLs that need replacement with the provided mapping.

## URL Mapping Reference

- `cheery-syrniki-b5b6ca.netlify.app` → `pipeline.smartcrm.vip`
- `taupe-sprinkles-83c9ee.netlify.app` → `contacts.smartcrm.vip`
- `serene-valkyrie-fec320.netlify.app` → `agency.smartcrm.vip`
- `capable-mermaid-3c73fa.netlify.app` → `calendar.smartcrm.vip`
- `moonlit-tarsier-239e70.netlify.app` → `white-label.smartcrm.vip`
- `stupendous-twilight-64389a.netlify.app` → `analytics.smartcrm.vip`
- `clever-syrniki-4df87f.netlify.app` → `research.smartcrm.vip`
- `resilient-frangipane-6289c8.netlify.app` → `analytics.smartcrm.vip`
- `cerulean-crepe-9470cc.netlify.app` → `landing.smartcrm.vip`

### Task 1: Update Remote Loader Components Group 1

**Files:**
- Modify: `client/src/components/RemoteContactsLoader.tsx`
- Modify: `client/src/components/RemoteAnalyticsLoader.tsx`
- Modify: `client/src/components/RemoteAIAnalyticsLoader.tsx`
- Modify: `client/src/components/ModuleFederationResearch.tsx`

- [ ] **Step 1: Read RemoteContactsLoader.tsx and identify netlify URLs**

Use grep or read the file to find any instances of netlify.app URLs.

- [ ] **Step 2: Replace URLs in RemoteContactsLoader.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip` in all occurrences (constants, src attributes, etc.).

- [ ] **Step 3: Read RemoteAnalyticsLoader.tsx and identify netlify URLs**

Use grep or read the file.

- [ ] **Step 4: Replace URLs in RemoteAnalyticsLoader.tsx**

Replace `stupendous-twilight-64389a.netlify.app` with `analytics.smartcrm.vip`.

- [ ] **Step 5: Read RemoteAIAnalyticsLoader.tsx and identify netlify URLs**

- [ ] **Step 6: Replace URLs in RemoteAIAnalyticsLoader.tsx**

Replace `resilient-frangipane-6289c8.netlify.app` with `analytics.smartcrm.vip`.

- [ ] **Step 7: Read ModuleFederationResearch.tsx and identify netlify URLs**

- [ ] **Step 8: Replace URLs in ModuleFederationResearch.tsx**

Replace `clever-syrniki-4df87f.netlify.app` with `research.smartcrm.vip`.

- [ ] **Step 9: Commit changes for Group 1**

```bash
git add client/src/components/RemoteContactsLoader.tsx client/src/components/RemoteAnalyticsLoader.tsx client/src/components/RemoteAIAnalyticsLoader.tsx client/src/components/ModuleFederationResearch.tsx
git commit -m "feat: update netlify URLs to smartcrm.vip in remote loader components group 1"
```

### Task 2: Update Remote Loader Components Group 2

**Files:**
- Modify: `client/src/components/RemoteFunnelCraftLoader.tsx`
- Modify: `client/src/components/RemoteSmartCRMLoader.tsx`
- Modify: `client/src/components/RemoteWhiteLabelLoader.tsx`
- Modify: `client/src/components/RemoteWLLoader.tsx`

- [ ] **Step 1: Read RemoteFunnelCraftLoader.tsx and identify netlify URLs**

- [ ] **Step 2: Replace URLs in RemoteFunnelCraftLoader.tsx**

Replace `cerulean-crepe-9470cc.netlify.app` with `landing.smartcrm.vip`.

- [ ] **Step 3: Read RemoteSmartCRMLoader.tsx and identify netlify URLs**

Note: This file appears twice in the list, ensure both are updated if different.

- [ ] **Step 4: Replace URLs in RemoteSmartCRMLoader.tsx**

Replace `serene-valkyrie-fec320.netlify.app` with `agency.smartcrm.vip`.

- [ ] **Step 5: Read RemoteWhiteLabelLoader.tsx and identify netlify URLs**

- [ ] **Step 6: Replace URLs in RemoteWhiteLabelLoader.tsx**

Replace `moonlit-tarsier-239e70.netlify.app` with `white-label.smartcrm.vip`.

- [ ] **Step 7: Read RemoteWLLoader.tsx and identify netlify URLs**

- [ ] **Step 8: Replace URLs in RemoteWLLoader.tsx**

Replace `moonlit-tarsier-239e70.netlify.app` with `white-label.smartcrm.vip`.

- [ ] **Step 9: Commit changes for Group 2**

```bash
git add client/src/components/RemoteFunnelCraftLoader.tsx client/src/components/RemoteSmartCRMLoader.tsx client/src/components/RemoteWhiteLabelLoader.tsx client/src/components/RemoteWLLoader.tsx
git commit -m "feat: update netlify URLs to smartcrm.vip in remote loader components group 2"
```

### Task 3: Update Page Components

**Files:**
- Modify: `client/src/pages/EnhancedDashboard.tsx`
- Modify: `client/src/pages/Dashboard copy copy.tsx`
- Modify: `client/src/pages/ContactsWithRemote.tsx`
- Modify: `client/src/pages/Pipeline.tsx`
- Modify: `client/src/pages/RemotePipeline.tsx`
- Modify: `client/src/pages/PipelineWithRemote.tsx`

- [ ] **Step 1: Read EnhancedDashboard.tsx and identify netlify URLs**

- [ ] **Step 2: Replace URLs in EnhancedDashboard.tsx**

Replace any netlify URLs with corresponding smartcrm.vip based on mapping (likely analytics or agency).

- [ ] **Step 3: Read Dashboard copy copy.tsx and identify netlify URLs**

- [ ] **Step 4: Replace URLs in Dashboard copy copy.tsx**

- [ ] **Step 5: Read ContactsWithRemote.tsx and identify netlify URLs**

- [ ] **Step 6: Replace URLs in ContactsWithRemote.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 7: Read Pipeline.tsx and identify netlify URLs**

- [ ] **Step 8: Replace URLs in Pipeline.tsx**

Replace `cheery-syrniki-b5b6ca.netlify.app` with `pipeline.smartcrm.vip`.

- [ ] **Step 9: Read RemotePipeline.tsx and identify netlify URLs**

- [ ] **Step 10: Replace URLs in RemotePipeline.tsx**

Replace `cheery-syrniki-b5b6ca.netlify.app` with `pipeline.smartcrm.vip`.

- [ ] **Step 11: Read PipelineWithRemote.tsx and identify netlify URLs**

- [ ] **Step 12: Replace URLs in PipelineWithRemote.tsx**

Replace `cheery-syrniki-b5b6ca.netlify.app` with `pipeline.smartcrm.vip`.

- [ ] **Step 13: Commit changes for Page Components**

```bash
git add client/src/pages/EnhancedDashboard.tsx client/src/pages/Dashboard\ copy\ copy.tsx client/src/pages/ContactsWithRemote.tsx client/src/pages/Pipeline.tsx client/src/pages/RemotePipeline.tsx client/src/pages/PipelineWithRemote.tsx
git commit -m "feat: update netlify URLs to smartcrm.vip in page components"
```

### Task 4: Update Service Files

**Files:**
- Modify: `client/src/services/remoteContactsBridge.ts`
- Modify: `client/src/services/remoteAppHealthService.ts`

- [ ] **Step 1: Read remoteContactsBridge.ts and identify netlify URLs**

- [ ] **Step 2: Replace URLs in remoteContactsBridge.ts**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 3: Read remoteAppHealthService.ts and identify netlify URLs**

- [ ] **Step 4: Replace URLs in remoteAppHealthService.ts**

Replace any netlify URLs with smartcrm.vip equivalents.

- [ ] **Step 5: Commit changes for Service Files**

```bash
git add client/src/services/remoteContactsBridge.ts client/src/services/remoteAppHealthService.ts
git commit -m "feat: update netlify URLs to smartcrm.vip in service files"
```

### Task 5: Update Contacts Components

**Files:**
- Modify: `client/src/components/contacts/WebComponentsRemoteContacts.tsx`
- Modify: `client/src/components/contacts/SmartIframeContacts.tsx`
- Modify: `client/src/components/contacts/RemoteContactsIntegration.tsx`
- Modify: `client/src/components/contacts/RemoteContactsWithAssistant.tsx`
- Modify: `client/src/components/contacts/AutoLoadingRemoteContacts.tsx`

- [ ] **Step 1: Read WebComponentsRemoteContacts.tsx and identify netlify URLs**

- [ ] **Step 2: Replace URLs in WebComponentsRemoteContacts.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 3: Read SmartIframeContacts.tsx and identify netlify URLs**

- [ ] **Step 4: Replace URLs in SmartIframeContacts.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 5: Read RemoteContactsIntegration.tsx and identify netlify URLs**

- [ ] **Step 6: Replace URLs in RemoteContactsIntegration.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 7: Read RemoteContactsWithAssistant.tsx and identify netlify URLs**

- [ ] **Step 8: Replace URLs in RemoteContactsWithAssistant.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 9: Read AutoLoadingRemoteContacts.tsx and identify netlify URLs**

- [ ] **Step 10: Replace URLs in AutoLoadingRemoteContacts.tsx**

Replace `taupe-sprinkles-83c9ee.netlify.app` with `contacts.smartcrm.vip`.

- [ ] **Step 11: Commit changes for Contacts Components**

```bash
git add client/src/components/contacts/WebComponentsRemoteContacts.tsx client/src/components/contacts/SmartIframeContacts.tsx client/src/components/contacts/RemoteContactsIntegration.tsx client/src/components/contacts/RemoteContactsWithAssistant.tsx client/src/components/contacts/AutoLoadingRemoteContacts.tsx
git commit -m "feat: update netlify URLs to smartcrm.vip in contacts components"
```

### Task 6: Update Other Components

**Files:**
- Modify: `client/src/components/IframeOverlapDetector.tsx`
- Modify: `client/src/components/DevBypassButton.tsx`
- Modify: `client/src/components/RemotePipelineLoader.tsx`

Note: RemotePipelineLoader appears to be a duplicate or additional, update accordingly.

- [ ] **Step 1: Read IframeOverlapDetector.tsx and identify netlify URLs**

- [ ] **Step 2: Replace URLs in IframeOverlapDetector.tsx**

Replace any netlify URLs with smartcrm.vip equivalents.

- [ ] **Step 3: Read DevBypassButton.tsx and identify netlify URLs**

- [ ] **Step 4: Replace URLs in DevBypassButton.tsx**

Replace any netlify URLs with smartcrm.vip equivalents.

- [ ] **Step 5: Read RemotePipelineLoader.tsx and identify netlify URLs**

- [ ] **Step 6: Replace URLs in RemotePipelineLoader.tsx**

Replace `cheery-syrniki-b5b6ca.netlify.app` with `pipeline.smartcrm.vip`.

- [ ] **Step 7: Commit changes for Other Components**

```bash
git add client/src/components/IframeOverlapDetector.tsx client/src/components/DevBypassButton.tsx client/src/components/RemotePipelineLoader.tsx
git commit -m "feat: update netlify URLs to smartcrm.vip in other components"
```

### Task 7: Update Security Middleware

**Files:**
- Identify and modify security middleware files (CORS, domain allowlists)

- [ ] **Step 1: Search for security middleware files**

Use grep to find files containing CORS, allowed origins, or domain restrictions.

Expected files: Likely in server/ or config/ directories, or middleware files.

- [ ] **Step 2: Read identified security files and locate domain restrictions**

- [ ] **Step 3: Update domain allowlists to include smartcrm.vip domains**

Replace netlify.app domains with smartcrm.vip equivalents in allowlists.

- [ ] **Step 4: Commit changes for Security Middleware**

```bash
git add <identified security files>
git commit -m "feat: update security middleware to allow smartcrm.vip domains"
```

### Task 8: Verification

**Files:**
- All modified files

- [ ] **Step 1: Run grep to verify no netlify.app URLs remain**

```bash
grep -r "netlify.app" client/src/
```

Expected: No results.

- [ ] **Step 2: Check that all smartcrm.vip domains are present**

```bash
grep -r "smartcrm.vip" client/src/
```

Expected: All expected domains found.

- [ ] **Step 3: Run any available linting or type checking**

If there are npm scripts for lint/typecheck, run them.

- [ ] **Step 4: Final commit if any verification issues fixed**

```bash
git add <any fixed files>
git commit -m "fix: address verification issues from URL migration"
```