# AI Calendar Module Federation Setup

## ✅ What's Been Done in CRM

The SmartCRM application is now configured to load the AI Calendar from `https://calendar.smartcrm.vip/` using Module Federation with an intelligent fallback system:

### 1. **Module Federation First**
- Attempts to load the calendar as a federated module (if configured)
- URL: `https://calendar.smartcrm.vip/remoteEntry.js`
- Scope: `CalendarApp`
- Module: `./CalendarApp`

### 2. **Iframe Fallback**
- If Module Federation fails (3-second timeout), automatically falls back to iframe
- URL: `https://calendar.smartcrm.vip?theme=light&mode=light`
- Includes theme synchronization via PostMessage

### 3. **Smart Integration**
- Shared state management between CRM and calendar
- Theme synchronization (light/dark mode)
- Real-time data updates via event broadcasting

## 📋 What Needs to Be Done at calendar.smartcrm.vip

To enable **full Module Federation** (instead of iframe fallback), the calendar app needs:

### Step 1: Install Module Federation Plugin
```bash
npm install @originjs/vite-plugin-federation
```

### Step 2: Use the Provided Config
Replace your `vite.config.js` with the configuration file we've created:
- Located at: `module-federation-configs/calendar-app-vite.config.js`

### Step 3: Create CalendarApp Component
Create a new file `src/CalendarApp.tsx` that exports your main calendar component:

```tsx
// src/CalendarApp.tsx
import { YourMainCalendarComponent } from './components/Calendar';

interface CalendarAppProps {
  theme?: 'light' | 'dark';
  mode?: 'light' | 'dark';
  sharedData?: any;
  onDataUpdate?: (data: any) => void;
}

const CalendarApp: React.FC<CalendarAppProps> = ({ 
  theme = 'light', 
  mode = 'light',
  sharedData,
  onDataUpdate 
}) => {
  return (
    <div className="w-full h-full">
      <YourMainCalendarComponent 
        theme={theme}
        mode={mode}
        data={sharedData}
        onChange={onDataUpdate}
      />
    </div>
  );
};

export default CalendarApp;
```

### Step 4: Update Main Entry (Optional)
If you want to maintain standalone functionality:

```tsx
// src/main.tsx
import CalendarApp from './CalendarApp';
import { createRoot } from 'react-dom/client';

// Export for Module Federation
export { default } from './CalendarApp';

// Render for standalone use
const root = createRoot(document.getElementById('root')!);
root.render(<CalendarApp />);
```

### Step 5: Build and Deploy
```bash
npm run build
```

After deployment, the calendar will be available at:
- `https://calendar.smartcrm.vip/remoteEntry.js` (Module Federation)
- `https://calendar.smartcrm.vip/` (Standalone)

## 🔄 Current Behavior

### Without Module Federation Setup (Current)
- Calendar loads via **iframe** at `https://calendar.smartcrm.vip`
- Works perfectly fine, just uses iframe instead of native integration
- Theme syncs via PostMessage

### With Module Federation Setup (Future)
- Calendar loads as a **native federated module**
- Better performance (no iframe overhead)
- Direct props passing and state sharing
- Seamless integration with CRM

## 🧪 Testing

1. **Check Current Status**: Look at browser console for:
   - "📺 Module Federation not available, using iframe fallback" = iframe mode (current)
   - "✅ Module Federation Calendar loaded successfully" = MF mode (after setup)

2. **Verify remoteEntry**: Visit `https://calendar.smartcrm.vip/remoteEntry.js`
   - If it exists → Module Federation is configured
   - If 404 → Still using iframe fallback

## 📊 Benefits of Module Federation

| Feature | Iframe | Module Federation |
|---------|--------|-------------------|
| Performance | Good | Excellent |
| State Sharing | PostMessage | Direct Props |
| Bundle Size | Separate | Shared Dependencies |
| SEO | Limited | Full |
| Debugging | Harder | Easier |
| Theme Sync | PostMessage | Direct Props |

## 🚀 Summary

✅ **CRM Side**: Fully configured and ready  
⏳ **Calendar Side**: Needs Module Federation setup (optional, iframe works fine)

The calendar will work **immediately** via iframe fallback. Module Federation setup is an **enhancement** for better performance and integration.
