# UI Integration Plan: OpenClaw & Agency Agents

## Overview

This document outlines how to integrate OpenClaw CRM and Agency Agents into the existing Smart CRM UI, making users aware of these system enhancements.

## Current Navigation Structure

The Smart CRM navbar already has an "Apps" dropdown showing connected apps:

```typescript
// From Navbar.tsx lines 277-281
const connectedApps = [
  { name: 'FunnelCraft AI', url: '/funnelcraft-ai', icon: Megaphone, isExternal: false },
  { name: 'SmartCRM Closer', url: '/smartcrm-closer', icon: Users, isExternal: false },
  { name: 'ContentAI', url: '/content-ai', icon: FileText, isExternal: false },
];
```

---

## Integration Options

### Option 1: Add to Apps Dropdown (Quickest)

Add OpenClaw and Agency Agents to the existing connected apps dropdown:

```typescript
// Updated connectedApps array
const connectedApps = [
  { name: 'FunnelCraft AI', url: '/funnelcraft-ai', icon: Megaphone, isExternal: false },
  { name: 'SmartCRM Closer', url: '/smartcrm-closer', icon: Users, isExternal: false },
  { name: 'ContentAI', url: '/content-ai', icon: FileText, isExternal: false },
  // NEW: OpenClaw AI Integration
  { name: 'OpenClaw AI Chat', url: '/openclaw-chat', icon: Bot, isExternal: false },
];
```

### Option 2: Add New Tab in Navbar

Add a dedicated "AI Agents" tab in the main navigation:

```typescript
// Add to allTabs array
{
  id: 'ai-agents',
  label: 'AI Agents',
  icon: Bot,
  action: (e?: React.MouseEvent) => toggleDropdown('ai-agents', e),
  badge: 2, // OpenClaw + Agency Agents
  color: 'from-violet-500 to-purple-500',
  hasDropdown: true,
}
```

### Option 3: Create New Pages with Routes

Add full pages accessible via navigation:

| Route            | Page             | Description       |
| ---------------- | ---------------- | ----------------- |
| `/openclaw-chat` | OpenClawChatPage | AI chat interface |

---

## Recommended Approach: Hybrid

**Use a combination for maximum visibility:**

1. **Add to Apps dropdown** (low friction, high visibility)
2. **Create landing pages** for deeper features

---

## Implementation Steps

### Step 1: Update Navbar.tsx

Add new apps to the `connectedApps` array:

```typescript
const connectedApps = [
  { name: 'FunnelCraft AI', url: '/funnelcraft-ai', icon: Megaphone, isExternal: false },
  { name: 'SmartCRM Closer', url: '/smartcrm-closer', icon: Users, isExternal: false },
  { name: 'ContentAI', url: '/content-ai', icon: FileText, isExternal: false },
  // Add these new entries:
  { name: 'OpenClaw AI Chat', url: '/openclaw-chat', icon: Bot, isExternal: false },
];
```

### Step 2: Add Routes in App.tsx

Add new routes for the pages:

```typescript
// Lazy load new pages
const OpenClawChatPage = lazy(() => import('./pages/OpenClawChatPage'));

// Add routes
<Route
  path="/openclaw-chat"
  element={
    <ProtectedRoute>
      <Navbar />
      <OpenClawChatPage />
    </ProtectedRoute>
  }
/>

```

### Step 3: Create OpenClaw Chat Page

Create a page that connects to OpenClaw's AI chat capabilities:

**File**: `client/src/pages/OpenClawChatPage.tsx`

Features:

- Chat interface with message history
- Connection to OpenClaw API (40+ endpoints)
- Streaming responses (SSE)
- Tool execution for CRM actions

## Files to Create/Modify

| Action | File                                    | Description          |
| ------ | --------------------------------------- | -------------------- |
| Modify | `client/src/components/Navbar.tsx`      | Add to connectedApps |
| Modify | `client/src/App.tsx`                    | Add routes           |
| Create | `client/src/pages/OpenClawChatPage.tsx` | AI chat page         |

| Create | `client/src/services/openclawService.ts` | API integration |
| Create | `client/src/services/agencyAgentsService.ts` | Agent orchestration |

---

## Integration Status

- [ ] Update Navbar.tsx with new app entries
- [ ] Add routes in App.tsx
- [ ] Create OpenClawChatPage.tsx
- [ ] Create AgencyAgentsPage.tsx
- [ ] Create API service for OpenClaw
- [ ] Create agent loading service for Agency Agents
- [ ] Test navigation and page loading

---

## Notes

1. **OpenClaw API**: Requires API key setup in Settings > OpenClaw
2. **Agency Agents**: Can run directly without external API (prompt-based)
3. **Both can coexist** - OpenClaw provides CRM-specific AI chat, Agency Agents provides specialized task execution

---

_Document Version: 1.0_
_Last Updated: March 2025_
