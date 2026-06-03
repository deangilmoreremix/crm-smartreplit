# Twenty CRM Features Enhancement Plan

## Stack
- **Supabase**: Storage & Edge Functions
- **Netlify**: Hosting & Functions
- **OpenAI**: Responses API & other APIs

## Part 1: Fix PR #4 - Button Component

### Issue
The workflows PR removed `ButtonVariant.primary` and used `default` instead, breaking existing code.

### Solution
Updated Button.tsx to support both naming conventions with proper backward compatibility.

---

## Part 2: Client-Side Features from Twenty (No Server Required)

### 1. UI Components (Direct from Twenty)

#### Display Components
- **Avatar**: User avatar with fallback initials
- **Icon**: Unified icon system
- **Tooltip**: Information tooltips
- **Callout**: Highlighted callout boxes
- **Banner**: Notification banners

#### Input Components
- **Button** ✅ (Already fixed)
- **Chip**: Tag-like elements
- **Tag**: Category tags

#### Layout Components
- **Card**: Content card containers
- **Section**: Layout sections
- **Modal**: Dialog modals

#### Navigation Components
- **NavigationBar**: App navigation
- **Menu**: Dropdown menus
- **Link**: Styled links

### 2. AI-Powered Features (OpenAI Integration)

#### Smart Features
1. **AI Contact Enrichment** - Already implemented
2. **AI Lead Scoring** - Already implemented
3. **AI Email Generation** - Use OpenAI Responses API
4. **AI Meeting Summaries** - Use OpenAI
5. **AI Task Recommendations** - Use OpenAI

### 3. Workflow Engine (Client-Side)

The workflow engine can run client-side:
- Trigger evaluation (client-side events)
- Action execution (API calls via edge functions)
- Condition evaluation

### 4. Calendar Integration (Client-Side)

1. **Smart Scheduling** - Suggest meeting times based on AI analysis
2. **Calendar View** - Calendar component for appointments
3. **Time Zone Handling** - Client-side timezone conversion

### 5. Storage Features (Supabase)

1. **File Attachments** - Upload to Supabase storage
2. **Image Upload** - Contact images, deal images
3. **Document Storage** - CRM document management

---

## Implementation Plan

### Phase 1: UI Components (Low Risk)
1. Add Avatar component
2. Add Icon component with common icons
3. Add Tooltip component
4. Add Chip/Tag components
5. Add Callout component

### Phase 2: Storage Integration (Medium Risk)
1. Add Supabase storage for file uploads
2. Add image upload component
3. Add document preview component

### Phase 3: AI Features (Medium Risk)
1. Add AI email generation component
2. Add AI meeting summary component
3. Add AI task recommendation component

### Phase 4: Workflow Engine (Higher Risk)
1. Add workflow builder UI (fix the design breaking issue)
2. Add workflow monitor UI
3. Add client-side workflow execution

---

## Features That Can Run Without Server

### Client-Side Only
1. **Local Storage** - Cache data in localStorage/IndexedDB
2. **Offline Mode** - PWA with service workers
3. **Client-Side Routing** - React Router
4. **State Management** - React Context/Zustand

### Supabase Edge Functions (Serverless)
1. **File Processing** - Image resizing, PDF generation
2. **AI Integration** - OpenAI API calls
3. **Email Sending** - Via Supabase Edge Functions
4. **Webhooks** - Outbound webhooks

### Netlify Functions (Serverless)
1. **OpenAI Proxy** - API gateway for OpenAI
2. **Webhook Handlers** - Inbound webhooks
3. **Email Processing** - Email handling

---

## Twenty Features to Add

### High Priority
1. **Command Menu** (⌘K) - Quick actions
2. **Activity Timeline** - Contact activities
3. **Smart Notifications** - Desktop notifications
4. **Keyboard Shortcuts** - Navigation shortcuts

### Medium Priority
1. **Drag & Drop** - Reorder items
2. **Inline Editing** - Edit in place
3. **Rich Text Editor** - Notes with formatting
4. **Image Gallery** - Display images

### Low Priority
1. **Video Embeds** - YouTube/Vimeo embeds
2. **Chart Components** - Analytics charts
3. **Map Integration** - Location maps
4. **Calendar Views** - Multiple calendar views

---

## Client-Side Implementation

### Example: Command Menu (⌘K)
```tsx
// No server required - pure client-side
const CommandMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <CommandMenuDialog open={open} onOpenChange={setOpen} />;
};
```

### Example: Activity Timeline
```tsx
// Client-side with Supabase for data
const ActivityTimeline: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    // Fetch from Supabase
  }, [contactId]);
  return <Timeline items={activities} />;
};
```

### Example: Smart Notifications
```tsx
// Client-side notification API
const useNotifications = () => {
  const requestPermission = async () => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  return { requestPermission, showNotification };
};
```

---

## Next Steps

1. ✅ Fix Button component (DONE)
2. Add Avatar component
3. Add Icon component
4. Add Tooltip component
5. Add Command Menu (⌘K)
6. Add Activity Timeline
7. Add Smart Notifications

---
*Generated: 2026-06-03*