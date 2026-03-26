# OpenClaw UI Integration Plan
## Adding OpenClaw to CRM-SmartReplit Interface

---

## Executive Summary

This document outlines how to add OpenClaw UI to the CRM-SmartReplit platform, giving users the option to use OpenClaw's advanced AI chat capabilities alongside the existing AI assistant.

---

## Current State

The CRM-SmartReplit already has an AI chat interface:

| Component | Location | Features |
|-----------|----------|----------|
| **StreamingChat** | client/src/components/aiTools/StreamingChat.tsx | Basic AI chat, model selection, streaming responses |
| **AIAssistantChat** | client/src/components/aiTools/AIAssistantChat.tsx | Enhanced AI assistant |
| **AgentWorkflowChat** | client/src/components/aiTools/AgentWorkflowChat.tsx | Agent workflow chat |

**What's Missing:**
- OpenClaw's 40+ AI tools for CRM actions
- AI agent integration (147 specialized agents)
- Advanced tool execution capabilities
- Multi-agent workflow support

---

## Integration Options

### Option A: Add OpenClaw as a New Tab (Recommended)

Add OpenClaw as a dedicated navigation item in the navbar:

```typescript
// In Navbar.tsx - Add to main navigation
const mainTabs = [
  // ... existing tabs
  {
    id: 'openclaw',
    label: 'OpenClaw AI',
    icon: Bot,
    path: '/openclaw',
    badge: 'NEW',
    color: 'from-violet-500 to-purple-500'
  }
];
```

### Option B: Add to AI Tools Dropdown

Add OpenClaw as an option within the existing AI Tools section:

```typescript
// In Navbar.tsx - Add to AI Tools dropdown
const aiToolsItems = [
  // ... existing tools
  {
    id: 'openclaw-chat',
    label: 'OpenClaw AI Chat',
    description: 'AI chat with 40+ CRM tools',
    icon: Bot
  },
  {
    id: 'agency-agents',
    label: 'Agency Specialists',
    description: '147 specialized AI agents',
    icon: Users
  }
];
```

### Option C: Side Panel Chat Widget

Add OpenClaw as a floating side panel that's accessible from anywhere:

```typescript
// Floating button in bottom-right corner
<FloatingChatButton 
  icon={<Bot />}
  label="OpenClaw AI"
  onClick={() => setOpenClawPanelOpen(true)}
/>

// Side panel component
<OpenClawPanel 
  isOpen={isOpenClawPanelOpen}
  onClose={() => setOpenClawPanelOpen(false)}
/>
```

### Option D: Replace Existing AI Assistant (NOT Recommended)

Replace the existing StreamingChat with OpenClaw - this breaks existing functionality.

---

## Recommended Approach: Hybrid (Options A + C)

Use both:
1. **Main Tab** - Full OpenClaw page for power users
2. **Side Panel** - Quick access for casual users

---

## Implementation Architecture

### 1. Create OpenClaw Page Component

**File**: `client/src/pages/OpenClawPage.tsx`

```tsx
import React, { useState } from 'react';
import OpenClawChat from '../components/openclaw/OpenClawChat';
import OpenClawToolsPanel from '../components/openclaw/OpenClawToolsPanel';
import OpenClawSidebar from '../components/openclaw/OpenClawSidebar';

const OpenClawPage: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Agent/Team Selection */}
      <OpenClawSidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <OpenClawChat onToolSelect={setSelectedTool} />
      </div>
      
      {/* Tools Panel */}
      {showTools && (
        <OpenClawToolsPanel 
          selectedTool={selectedTool}
          onClose={() => setShowTools(false)}
        />
      )}
    </div>
  );
};

export default OpenClawPage;
```

### 2. Create OpenClaw Chat Component

**File**: `client/src/components/openclaw/OpenClawChat.tsx`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  result?: any;
}

interface OpenClawChatProps {
  onToolSelect?: (toolName: string) => void;
}

const OpenClawChat: React.FC<OpenClawChatProps> = ({ onToolSelect }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm OpenClaw AI. I can help you manage your CRM through natural conversation. Try asking me to:\n\n• Search for contacts\n• Create a new deal\n• Schedule a meeting\n• View pipeline details\n• And much more!\n\nWhat would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Call OpenClaw API (via proxy)
      const response = await fetch('/api/openclaw/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        toolCalls: data.toolCalls,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If tool was executed, broadcast to UnifiedEventSystem
      if (data.toolCalls) {
        data.toolCalls.forEach(toolCall => {
          if (onToolSelect) onToolSelect(toolCall.name);
          // Emit event for Module Federation apps
          window.dispatchEvent(new CustomEvent('openclaw:tool:execute', {
            detail: toolCall
          }));
        });
      }
    } catch (error) {
      console.error('OpenClaw error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-violet-600 mr-2" />
          <h1 className="text-xl font-bold">OpenClaw AI</h1>
          <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
            Beta
          </span>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-700">
          <Settings size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-center mb-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'user' ? <User size={14} className="mr-1" /> : <Bot size={14} className="mr-1" />}
                <span className="text-xs text-gray-500">
                  {message.role === 'user' ? 'You' : 'OpenClaw AI'}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white border'}`}>
                <p className="whitespace-pre-line">{message.content}</p>
                
                {/* Show tool calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Tools executed:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.toolCalls.map((tool, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-3">
              <div className="flex items-center text-gray-500">
                <Bot size={14} className="mr-2 animate-pulse" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask OpenClaw to help with your CRM..."
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-violet-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="p-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpenClawChat;
```

### 3. Create Side Panel Component

**File**: `client/src/components/openclaw/OpenClawPanel.tsx`

```tsx
import React from 'react';
import { X, Bot } from 'lucide-react';
import OpenClawChat from './OpenClawChat';

interface OpenClawPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const OpenClawPanel: React.FC<OpenClawPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-violet-600 text-white rounded-t-xl">
        <div className="flex items-center">
          <Bot size={20} className="mr-2" />
          <span className="font-semibold">OpenClaw AI</span>
        </div>
        <button onClick={onClose} className="hover:bg-violet-700 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Chat (compact version) */}
      <div className="flex-1">
        <OpenClawChat />
      </div>
    </div>
  );
};

export default OpenClawPanel;
```

### 4. Update Navigation (Navbar.tsx)

Add OpenClaw to the navigation:

```tsx
// Add to connectedApps array
const connectedApps = [
  { name: 'OpenClaw AI', url: '/openclaw', icon: Bot, isExternal: false },
  // ... existing apps
];
```

### 5. Add Route (App.tsx)

```tsx
// Add lazy-loaded route
const OpenClawPage = lazy(() => import('./pages/OpenClawPage'));

// Add to routes
<Route
  path="/openclaw"
  element={
    <ProtectedRoute>
      <Navbar />
      <OpenClawPage />
    </ProtectedRoute>
  }
/>
```

---

## File Structure

```
client/src/
├── components/
│   └── openclaw/
│       ├── OpenClawChat.tsx        # Main chat component
│       ├── OpenClawPanel.tsx       # Side panel (floating)
│       ├── OpenClawToolsPanel.tsx  # Tools sidebar
│       ├── OpenClawSidebar.tsx     # Agent/team selector
│       └── index.ts                # Export all components
├── pages/
│   └── OpenClawPage.tsx            # Full page route
├── services/
│   └── openclawService.ts          # API calls to OpenClaw
└── App.tsx                          # Add route
```

---

## User Experience

### Full Page View

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar                                                          │
├──────────┬──────────────────────────────────────┬───────────────┤
│ Sidebar  │         OpenClaw Chat                │   Tools       │
│          │                                       │   Panel       │
│ [Teams]  │  ┌─────────────────────────────────┐ │               │
│ [Agents] │  │ You: Create deal for Acme       │ │ [Search]      │
│          │  │ OpenClaw: Created deal!        │ │ [Contacts]    │
│ Select   │  │ Tools: create_deal executed    │ │ [Deals]       │
│ Agent    │  │                                 │ │ [Tasks]       │
│          │  └─────────────────────────────────┘ │ [Calendar]    │
│          │                                       │ [Email]       │
│          │  ┌─────────────────────────────────┐ │ [More...]     │
│          │  │ Type message...        [Send]  │ │               │
│          │  └─────────────────────────────────┘ │               │
└──────────┴──────────────────────────────────────┴───────────────┘
```

### Side Panel View

```
┌──────────────────────────────────────────────────┐
│  Navbar                                          │
│                        ┌────────────────────────┐│
│                        │ 🤖 OpenClaw AI    [X] ││
│                        ├────────────────────────┤│
│                        │ You: Show my deals     ││
│                        │ OpenClaw: [Results]     ││
│                        │                        ││
│                        │ [Type message...] [📤] ││
│                        └────────────────────────┘│
```

---

## API Integration

### Backend Route (server/routes/openclaw.ts)

```typescript
import express from 'express';
const router = express.Router();

// Proxy to OpenClaw API
router.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  
  // Call OpenClaw API
  const response = await fetch('http://localhost:3001/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY}`
    },
    body: JSON.stringify({
      message,
      history,
      tools: getCRMTools() // Include CRM tool definitions
    })
  });

  const data = await response.json();
  res.json(data);
});

export default router;
```

---

## Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| OpenClawPage | /openclaw | Full-page route |
| OpenClawChat | Side panel + page | Chat interface |
| OpenClawPanel | Floating widget | Quick access |
| OpenClawToolsPanel | Right sidebar | Tool selection |
| openclawService | API calls | Backend integration |

This gives users multiple ways to access OpenClaw AI:
1. **Full page** - `/openclaw` route for power users
2. **Floating button** - Bottom-right quick access
3. **Navbar dropdown** - Under AI Tools menu

---

*Document Version: 1.0*
*Last Updated: March 2025*