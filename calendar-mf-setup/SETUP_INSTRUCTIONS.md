# Module Federation Setup for calendar.smartcrm.vip

## 📋 Complete Setup Guide

Follow these steps to enable Module Federation on your calendar app.

---

## Step 1: Install Module Federation Plugin

```bash
npm install @originjs/vite-plugin-federation
```

---

## Step 2: Replace vite.config.js

Replace your entire `vite.config.js` with the provided `vite.config.js` file from this setup package.

**Key configuration details:**
- **Scope name**: `CalendarApp`
- **Entry file**: `remoteEntry.js`
- **Exposed module**: `./CalendarApp` → `./src/CalendarApp.tsx`
- **CORS**: Enabled for cross-origin loading

---

## Step 3: Create CalendarApp.tsx

1. Create a new file: `src/CalendarApp.tsx`
2. Use the provided `CalendarApp.tsx` template
3. **Important**: Replace `YourMainApp` with your actual main component import

Example:
```tsx
// If your main app is at src/App.tsx
import YourMainApp from './App';

// If your main app is at src/Dashboard.tsx
import YourMainApp from './Dashboard';

// If your main app is at src/components/MainCalendar.tsx
import YourMainApp from './components/MainCalendar';
```

---

## Step 4: Update Your Main Entry (Optional)

If you want to maintain standalone functionality, update `src/main.tsx`:

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

---

## Step 5: Build and Deploy

```bash
# Build the application
npm run build

# The build will create:
# - dist/remoteEntry.js (Module Federation entry)
# - dist/index.html (Standalone app)
# - dist/assets/* (App assets)
```

**Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)**

---

## Step 6: Verify Setup

After deployment, check these URLs:

### ✅ Module Federation Entry (MUST work)
```
https://calendar.smartcrm.vip/remoteEntry.js
```
- Should return JavaScript code (not HTML)
- Should contain "CalendarApp" references

### ✅ Standalone App (Should still work)
```
https://calendar.smartcrm.vip/
```
- Should show your calendar/dashboard app as normal

---

## Step 7: Test Module Federation

### Browser Console Test

Visit `https://calendar.smartcrm.vip/` and open browser console (F12):

```javascript
// Check if Module Federation is exposed
console.log(window.CalendarApp);
// Should show: {get: ƒ, init: ƒ}

// Test loading the module
window.CalendarApp.get('./CalendarApp').then(factory => {
  const module = factory();
  console.log('Module loaded:', module);
});
```

### Test in SmartCRM

1. Open your SmartCRM app
2. Navigate to `/calendar` route
3. Check browser console for:
   - ✅ "✅ Module Federation Calendar loaded successfully"
   - ❌ "❌ Module Federation failed" (if there's an issue)

---

## 🔧 Troubleshooting

### Issue: remoteEntry.js returns 404
**Solution**: Make sure `filename: 'remoteEntry.js'` is in your vite.config.js

### Issue: remoteEntry.js returns HTML instead of JS
**Solution**: 
- Your build didn't include Module Federation
- Check that `@originjs/vite-plugin-federation` is installed
- Verify the plugin is in your vite.config.js

### Issue: CORS errors
**Solution**: Verify CORS headers in vite.config.js (already included in provided config)

### Issue: Module not found
**Solution**: Check that `./CalendarApp` path matches your actual file location in `exposes` config

### Issue: Build fails
**Solution**: 
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Expected Build Output

After running `npm run build`, you should see:

```
dist/
├── remoteEntry.js          ← Module Federation entry (CRITICAL)
├── assets/
│   ├── CalendarApp-xxx.js  ← Your app code
│   ├── index-xxx.css       ← Styles
│   └── ...
└── index.html             ← Standalone app
```

---

## 🚀 Deployment Checklist

- [ ] `@originjs/vite-plugin-federation` installed
- [ ] `vite.config.js` replaced with Module Federation config
- [ ] `src/CalendarApp.tsx` created with correct imports
- [ ] Build successful (`npm run build`)
- [ ] `remoteEntry.js` exists in build output
- [ ] Deployed to https://calendar.smartcrm.vip/
- [ ] `https://calendar.smartcrm.vip/remoteEntry.js` returns JavaScript
- [ ] `https://calendar.smartcrm.vip/` still works as standalone
- [ ] Tested in SmartCRM at `/calendar` route

---

## 📞 Support

If Module Federation still doesn't work:

1. Check build output for `remoteEntry.js`
2. Verify the file is deployed and accessible
3. Check browser console for specific error messages
4. Ensure all dependencies are installed
5. Try a clean build: `rm -rf node_modules dist && npm install && npm run build`

---

## ✨ Once Complete

Your calendar will load seamlessly in SmartCRM via Module Federation with:
- ✅ Better performance (no iframe overhead)
- ✅ Direct props passing
- ✅ Shared React instances
- ✅ Real-time state synchronization
- ✅ Theme integration
