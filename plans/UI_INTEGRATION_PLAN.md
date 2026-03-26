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
  // NEW: OpenClaw & Agency Agents
  { name: 'OpenClaw AI Chat', url: '/openclaw-chat', icon: Bot, isExternal: false },
  { name: 'Agency Specialists', url: '/agency-agents', icon: Users, isExternal: false },
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

| Route | Page | Description |
|-------|------|-------------|
| `/openclaw-chat` | OpenClawChatPage | AI chat interface |
| `/agency-agents` | AgencyAgentsPage | Agent selector & playground |

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
  { name: 'Agency Specialists', url: '/agency-agents', icon: Sparkles, isExternal: false },
];
```

### Step 2: Add Routes in App.tsx

Add new routes for the pages:

```typescript
// Lazy load new pages
const OpenClawChatPage = lazy(() => import('./pages/OpenClawChatPage'));
const AgencyAgentsPage = lazy(() => import('./pages/AgencyAgentsPage'));

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
<Route
  path="/agency-agents"
  element={
    <ProtectedRoute>
      <Navbar />
      <AgencyAgentsPage />
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

### Step 4: Create Agency Agents Page

Create a page to browse and use 147+ specialized agents:

**File**: `client/src/pages/AgencyAgentsPage.tsx`

Features:
- Agent category browser (12 divisions)
- Agent search/filter
- Task input for selected agent
- Results display area

---

## UI Mockup for Agency Agents Page

```tsx
// Conceptual layout
<div className="p-6">
  <h1 className="text-2xl font-bold mb-4">AI Agency Specialists</h1>
  
  {/* Agent Categories */}
  <div className="flex gap-2 mb-6">
    {['Engineering', 'Sales', 'Marketing', 'Design', 'All'].map(cat => (
      <button key={cat} className="px-4 py-2 rounded-full bg-gray-100">
        {cat}
      </button>
    ))}
  </div>
  
  {/* Agent Grid */}
  <div className="grid grid-cols-3 gap-4">
    {filteredAgents.map(agent => (
      <div key={agent.id} className="p-4 border rounded-lg hover:shadow-md">
        <h3 className="font-semibold">{agent.name}</h3>
        <p className="text-sm text-gray-600">{agent.specialty}</p>
      </div>
    ))}
  </div>
  
  {/* Task Input */}
  <div className="mt-6">
    <textarea 
      placeholder="What do you need help with?" 
      className="w-full p-3 border rounded-lg"
    />
    <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
      Run Agent
    </button>
  </div>
</div>
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Modify | `client/src/components/Navbar.tsx` | Add to connectedApps |
| Modify | `client/src/App.tsx` | Add routes |
| Create | `client/src/pages/OpenClawChatPage.tsx` | AI chat page |
| Create | `client/src/pages/AgencyAgentsPage.tsx` | Agent selector page |
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

*Document Version: 1.0*
*Last Updated: March 2025*