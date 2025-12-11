# Complete Module Federation Setup for calendar.smartcrm.vip

## 🎯 Goal
Enable the calendar app to be loaded as a federated module in the SmartCRM application instead of an iframe.

## 📦 Step 1: Install Dependencies

```bash
npm install @originjs/vite-plugin-federation
```

## ⚙️ Step 2: Replace vite.config.js

Replace your entire `vite.config.js` with this:

```javascript
// vite.config.js for https://calendar.smartcrm.vip/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'CalendarApp',
      filename: 'remoteEntry.js',
      exposes: {
        './CalendarApp': './src/CalendarApp.tsx',
        './CalendarModule': './src/CalendarModule.tsx'
      },
      shared: {
        'react': {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: [],
      output: {
        format: 'systemjs',
        entryFileNames: 'remoteEntry.js',
        minifyInternalExports: false
      }
    }
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  }
})
```

## 📝 Step 3: Create CalendarApp.tsx

Create `src/CalendarApp.tsx` as the Module Federation entry point:

```tsx
// src/CalendarApp.tsx
import React from 'react';

// Import your main calendar component
import YourMainCalendar from './components/YourMainCalendar'; 

interface CalendarAppProps {
  theme?: 'light' | 'dark';
  mode?: 'light' | 'dark';
  sharedData?: {
    appointments?: any[];
    contacts?: any[];
    user?: any;
  };
  onDataUpdate?: (data: any) => void;
}

const CalendarApp: React.FC<CalendarAppProps> = ({ 
  theme = 'light', 
  mode = 'light',
  sharedData = {},
  onDataUpdate 
}) => {
  console.log('📅 CalendarApp loaded via Module Federation');
  console.log('🎨 Theme:', theme, 'Mode:', mode);
  console.log('📊 Shared data:', sharedData);

  const handleCalendarChange = (data: any) => {
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  };

  return (
    <div className="w-full h-full" data-module-federation="calendar">
      <YourMainCalendar 
        theme={theme}
        mode={mode}
        appointments={sharedData.appointments}
        onAppointmentChange={handleCalendarChange}
      />
    </div>
  );
};

export default CalendarApp;
```

## 🔄 Step 4: Update Main Entry (Optional)

To maintain standalone functionality, update `src/main.tsx`:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import CalendarApp from './CalendarApp';
import './index.css';

// Export for Module Federation
export { default } from './CalendarApp';

// Render for standalone use
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CalendarApp />
  </React.StrictMode>
);
```

## 🏗️ Step 5: Build and Deploy

```bash
# Build with Module Federation
npm run build

# The build will create remoteEntry.js in your dist folder
# Deploy to https://calendar.smartcrm.vip/
```

## ✅ Step 6: Verify

After deployment, verify these URLs work:

1. **Module Federation Entry**: `https://calendar.smartcrm.vip/remoteEntry.js`
   - Should return JavaScript code
   - Should NOT return 404

2. **Standalone App**: `https://calendar.smartcrm.vip/`
   - Should still work as before

## 🧪 Testing

### Test in Browser Console

Visit `https://calendar.smartcrm.vip/` and run:

```javascript
// Check if Module Federation is exposed
console.log(window.CalendarApp);
// Should show: {get: ƒ, init: ƒ}

// Check available modules
window.CalendarApp.get('./CalendarApp').then(factory => {
  const module = factory();
  console.log('Module loaded:', module);
});
```

### Test in SmartCRM

1. Navigate to `/calendar` in SmartCRM
2. Check browser console for:
   - ✅ "Module Federation Calendar loaded successfully" = SUCCESS
   - ❌ "Module Federation failed" = Check setup

## 📊 Expected Build Output

After running `npm run build`, you should see:

```
dist/
├── remoteEntry.js          ← Module Federation entry point
├── assets/
│   ├── CalendarApp-xxx.js  ← Your calendar component
│   └── ...
└── index.html             ← Standalone app
```

## 🔍 Troubleshooting

### Issue: remoteEntry.js returns 404
**Solution**: Make sure `filename: 'remoteEntry.js'` is in your vite.config.js

### Issue: CORS errors
**Solution**: Verify CORS headers in vite.config.js server section

### Issue: Module not found
**Solution**: Check that `./CalendarApp` path matches your actual file location

### Issue: Build fails
**Solution**: Ensure `@originjs/vite-plugin-federation` is installed

### Issue: Standalone app broken
**Solution**: Keep the export/render split in main.tsx as shown above

## 📱 Communication with CRM

Once loaded, your calendar will receive:

```typescript
// Props from CRM
{
  theme: 'light' | 'dark',
  mode: 'light' | 'dark',
  sharedData: {
    appointments: [...],
    contacts: [...],
    user: {...}
  },
  onDataUpdate: (data) => {
    // Called when calendar data changes
  }
}
```

And can send data back:

```typescript
// In your calendar component
props.onDataUpdate({
  type: 'APPOINTMENT_CREATED',
  appointment: newAppointment
});
```

## 🚀 Quick Start Script

Copy this entire block and run it in your calendar app directory:

```bash
# 1. Install federation plugin
npm install @originjs/vite-plugin-federation

# 2. Backup current config
cp vite.config.js vite.config.js.backup

# 3. You'll need to manually update vite.config.js with the config above

# 4. Create CalendarApp.tsx wrapper (adjust imports for your app)
# Create the file manually as shown in Step 3

# 5. Build and test
npm run build

# 6. Test remoteEntry.js locally
npx serve dist
# Visit http://localhost:3000/remoteEntry.js
```

## ✨ Benefits

Once complete, your calendar will:
- ✅ Load faster (no iframe overhead)
- ✅ Share React instances with CRM (smaller bundle)
- ✅ Communicate directly via props (no PostMessage)
- ✅ Support better debugging
- ✅ Enable seamless state sharing
