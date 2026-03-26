# OpenClaw UI Design - CRM-SmartReplit Style Guide
## Complete Design Specification

---

## Design System Overview

The OpenClaw UI will match the CRM-SmartReplit dashboard design exactly using:

- **Pill-shaped navigation**: `rounded-full` with gradient backgrounds
- **Portal-based dropdowns**: Floating panels with backdrop blur
- **Icon consistency**: Lucide React icons throughout
- **Dark mode support**: Conditional styling with `isDark` prop
- **Shadow layering**: `shadow-xl`, `shadow-2xl` for depth
- **Badge styling**: Colored counters with `animate-pulse`

---

## Page Layout

### Full Page Design (`/openclaw`)

```tsx
┌────────────────────────────────────────────────────────────────────────────┐
│  Navbar (existing)                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     OpenClaw Header                                │   │
│  │  ┌──────────┐  ┌──────────────────────┐  ┌────────────────────────┐ │   │
│  │  │ 🤖 Icon  │  │ OpenClaw AI    [BETA]│  │ [Settings] [Collapse] │ │   │
│  │  └──────────┘  └──────────────────────┘  └────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌──────────┬─────────────────────────────────────┬──────────────────────┐  │
│  │ Sidebar  │         Chat Messages               │   Tools Panel        │  │
│  │          │                                     │                      │  │
│  │ [Teams]  │  ┌───────────────────────────────┐ │  ┌────────────────┐  │  │
│  │          │  │ You: Create deal for Acme     │ │  │ 🔍 Search      │  │  │
│  │ ────────│  │                               │ │  │ 👥 Contacts    │  │  │
│  │          │  │ OpenClaw: Created deal!       │ │  │ 💼 Deals        │  │  │
│  │ [Agents] │  │ Tools: create_deal executed  │ │  │ ✓ Tasks         │  │  │
│  │ • Sales  │  └───────────────────────────────┘ │  │ 📅 Calendar     │  │  │
│  │ • Market │                                     │  │ 📧 Email        │  │  │
│  │ • Support│                                     │  │ 📊 Analytics    │  │  │
│  │ • Engineer│                                    │  │ ⚙️ Automation   │  │  │
│  │          │  ┌───────────────────────────────┐ │  │ 🔧 More...      │  │  │
│  │          │  │ Type a message...    [Send]  │ │  └────────────────┘  │  │
│  │          │  └───────────────────────────────┘ │                      │  │
│  └──────────┴─────────────────────────────────────┴──────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Page Header

```tsx
// Matches Navbar pill styling exactly
<div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200 rounded-t-2xl">
  <div className="flex items-center space-x-3">
    {/* Icon - matches Navbar tab icon style */}
    <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full">
      <Bot size={20} className="text-white" />
    </div>
    <div>
      <h1 className="text-xl font-bold text-gray-900">OpenClaw AI</h1>
      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
        Beta
      </span>
    </div>
  </div>
  <div className="flex items-center space-x-2">
    <button className="p-2 rounded-full hover:bg-gray-100 transition-all">
      <Settings size={18} className="text-gray-600" />
    </button>
    <button className="p-2 rounded-full hover:bg-gray-100 transition-all">
      <ChevronRight size={18} className="text-gray-600" />
    </button>
  </div>
</div>
```

### 2. Sidebar (Agent Selection)

```tsx
// Matches Navbar dropdown styling
<div className={`
  w-64 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} 
  backdrop-blur-2xl border-r ${isDark ? 'border-white/10' : 'border-gray-200'}
`}>
  {/* Section headers - match Navbar section styling */}
  <div className="p-3 border-b border-gray-200/30">
    <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      Teams
    </h3>
  </div>
  
  {/* Team items - match Navbar dropdown item styling */}
  <div className="p-2">
    {teams.map(team => (
      <button
        key={team.id}
        className={`
          w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
          ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}
          ${selectedTeam === team.id ? 'bg-violet-100 text-violet-700' : ''}
        `}
      >
        <div className={`p-2 rounded-lg ${team.color}`}>
          <team.icon size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium">{team.name}</span>
      </button>
    ))}
  </div>
  
  {/* Divider */}
  <div className="p-3 border-t border-gray-200/30">
    <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      Agents
    </h3>
  </div>
  
  {/* Agent list */}
  <div className="p-2 max-h-64 overflow-y-auto">
    {agents.map(agent => (
      <button
        key={agent.id}
        className={`
          w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
          ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}
          ${selectedAgent === agent.id ? 'bg-violet-100 text-violet-700' : ''}
        `}
      >
        <Bot size={16} className="text-violet-500" />
        <span className="text-sm font-medium">{agent.name}</span>
        {agent.badge && (
          <span className="ml-auto text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
            {agent.badge}
          </span>
        )}
      </button>
    ))}
  </div>
</div>
```

### 3. Chat Messages Area

```tsx
// Matches StreamingChat component styling
<div className="flex-1 overflow-y-auto p-4 bg-gray-50">
  <div className="space-y-4">
    {messages.map(message => (
      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
          {/* Message header */}
          <div className={`flex items-center mb-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'user' ? (
              <User size={14} className="mr-1 text-gray-400" />
            ) : (
              <Bot size={14} className="mr-1 text-violet-500" />
            )}
            <span className="text-xs text-gray-500">
              {message.role === 'user' ? 'You' : 'OpenClaw AI'}
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {formatTime(message.timestamp)}
            </span>
          </div>
          
          {/* Message bubble - matches StreamingChat styling */}
          <div className={`
            p-3 rounded-2xl shadow-sm
            ${message.role === 'user' 
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' 
              : 'bg-white border border-gray-200 text-gray-800'
            }
          `}>
            <p className="whitespace-pre-line text-sm">{message.content}</p>
            
            {/* Tool execution indicator */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className={`mt-2 pt-2 border-t ${message.role === 'user' ? 'border-white/20' : 'border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Tools executed:</p>
                <div className="flex flex-wrap gap-1">
                  {message.toolCalls.map((tool, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full"
                    >
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
    
    {/* Typing indicator */}
    {isProcessing && (
      <div className="flex justify-start">
        <div className="bg-white border rounded-2xl p-3 shadow-sm">
          <div className="flex items-center text-gray-500">
            <Bot size={14} className="mr-2 animate-pulse text-violet-500" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

### 4. Input Area

```tsx
// Matches StreamingChat input styling
<div className="p-4 bg-white border-t rounded-b-2xl">
  <form 
    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
    className="flex items-center space-x-3"
  >
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Ask OpenClaw to help with your CRM..."
      className="
        flex-1 p-3 border border-gray-200 rounded-xl
        focus:ring-2 focus:ring-violet-500 focus:border-violet-500
        transition-all duration-200
      "
      disabled={isProcessing}
    />
    <button
      type="submit"
      disabled={isProcessing || !input.trim()}
      className={`
        p-3 rounded-xl transition-all duration-200
        ${isProcessing || !input.trim()
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg'
        }
      `}
    >
      <Send size={20} />
    </button>
  </form>
  
  {/* Helper text - matches existing style */}
  <div className="flex justify-between mt-2 text-xs text-gray-500">
    <div className="flex items-center">
      <Zap size={12} className="mr-1 text-violet-500" />
      <span>AI executes CRM actions</span>
    </div>
    <span className="text-violet-600">Powered by OpenClaw</span>
  </div>
</div>
```

### 5. Tools Panel (Right Sidebar)

```tsx
// Matches Navbar dropdown styling
<div className={`
  w-72 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'}
  backdrop-blur-2xl border-l ${isDark ? 'border-white/10' : 'border-gray-200'}
`}>
  {/* Header */}
  <div className="p-4 border-b border-gray-200/30">
    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
      CRM Tools
    </h2>
  </div>
  
  {/* Tool categories */}
  <div className="p-3 max-h-[70vh] overflow-y-auto">
    {toolCategories.map(category => (
      <div key={category.name} className="mb-4">
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {category.name}
        </h3>
        <div className="space-y-1">
          {category.tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                w-full flex items-center space-x-3 p-2 rounded-xl transition-all duration-200
                ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}
              `}
            >
              <tool.icon size={16} className="text-violet-500" />
              <span className="text-sm">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## Floating Panel Design (Quick Access)

```tsx
// Matches Navbar dropdown styling - rounded-2xl with shadow-2xl
<div className="
  fixed bottom-6 right-6 
  w-96 max-h-[600px] 
  bg-white/95 backdrop-blur-2xl 
  border border-gray-200 
  rounded-2xl 
  shadow-2xl 
  z-50 
  flex flex-col
  overflow-hidden
">
  {/* Header - gradient matches Navbar tabs */}
  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-t-2xl">
    <div className="flex items-center space-x-2">
      <Bot size={18} />
      <span className="font-semibold">OpenClaw AI</span>
    </div>
    <div className="flex items-center space-x-1">
      <button 
        onClick={onExpand}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <Maximize2 size={16} />
      </button>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  </div>
  
  {/* Chat area */}
  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
    {/* Messages... */}
  </div>
  
  {/* Input */}
  <div className="p-3 bg-white border-t">
    <form className="flex gap-2">
      <input 
        className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
        placeholder="Ask OpenClaw..."
      />
      <button className="p-2 bg-violet-600 text-white rounded-lg">
        <Send size={16} />
      </button>
    </form>
  </div>
</div>
```

---

## Integration Points

### Add to Navbar (Apps Dropdown)

```tsx
// Add to connectedApps array in Navbar.tsx
const connectedApps = [
  { name: 'OpenClaw AI', url: '/openclaw', icon: Bot, isExternal: false },
  // ... existing apps
];
```

### Add Route in App.tsx

```tsx
// Add lazy-loaded route
const OpenClawPage = lazy(() => import('./pages/OpenClawPage'));

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

## Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary Gradient | `from-violet-500 to-purple-500` | `from-violet-600 to-purple-600` |
| Background | `bg-white/95` | `bg-gray-900/95` |
| Border | `border-gray-200` | `border-white/10` |
| Text Primary | `text-gray-900` | `text-white` |
| Text Secondary | `text-gray-600` | `text-gray-300` |
| Accent | `text-violet-600` | `text-violet-400` |
| Hover BG | `hover:bg-gray-50` | `hover:bg-white/5` |

---

## Animation Specifications

| Animation | CSS | Usage |
|-----------|-----|-------|
| Pulse | `animate-pulse` | Badge counters |
| Fade In | `animate-fade-in` | Dropdowns appearing |
| Scale | `hover:scale-105` | Button hover state |
| Rotate | `rotate-180` | Chevron on dropdown open |

---

## File Structure

```
client/src/
├── components/
│   └── openclaw/
│       ├── OpenClawPage.tsx        # Full page layout
│       ├── OpenClawChat.tsx        # Chat interface
│       ├── OpenClawSidebar.tsx     # Team/agent selector
│       ├── OpenClawToolsPanel.tsx  # Right tools sidebar
│       ├── OpenClawPanel.tsx       # Floating panel
│       └── index.ts                # Exports
├── pages/
│   └── OpenClawPage.tsx            # Route component
├── services/
│   └── openclawService.ts          # API integration
└── App.tsx                         # Add route
```

---

## Summary

The OpenClaw UI will match the CRM-SmartReplit dashboard design exactly:

1. **Pill-shaped buttons** with gradient backgrounds
2. **Portal-based panels** with backdrop blur
3. **Lucide React icons** throughout
4. **Dark mode support** with conditional classes
5. **Shadow layering** for depth
6. **Badge counters** with pulse animation
7. **Rounded corners** (2xl for containers, full for buttons)

This ensures seamless visual integration with the existing CRM interface.