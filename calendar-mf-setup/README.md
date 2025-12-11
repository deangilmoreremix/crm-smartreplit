# Module Federation Setup Package for calendar.smartcrm.vip

This package contains everything you need to enable Module Federation on your calendar app at `https://calendar.smartcrm.vip/`.

## 📦 Package Contents

1. **vite.config.js** - Complete Vite configuration with Module Federation
2. **CalendarApp.tsx** - Module Federation wrapper component
3. **SETUP_INSTRUCTIONS.md** - Detailed step-by-step setup guide
4. **package.json.example** - Reference for required dependencies

## 🚀 Quick Start

1. Navigate to your `calendar.smartcrm.vip` project
2. Install Module Federation plugin:
   ```bash
   npm install @originjs/vite-plugin-federation
   ```
3. Replace `vite.config.js` with the provided file
4. Create `src/CalendarApp.tsx` using the provided template
5. Build and deploy:
   ```bash
   npm run build
   ```

## 📚 Full Instructions

See `SETUP_INSTRUCTIONS.md` for complete setup details.

## ✅ What This Enables

- **Seamless Integration**: Load calendar as a native module in SmartCRM
- **Better Performance**: No iframe overhead
- **Direct Communication**: Props-based data sharing
- **Theme Sync**: Automatic light/dark mode synchronization
- **State Management**: Real-time data updates between apps

## 🔗 Configuration Details

- **Scope**: `CalendarApp`
- **Remote URL**: `https://calendar.smartcrm.vip/remoteEntry.js`
- **Exposed Module**: `./CalendarApp`
- **Shared Dependencies**: React, React-DOM

## 📞 Need Help?

See troubleshooting section in `SETUP_INSTRUCTIONS.md` or check:
- Build output for `remoteEntry.js`
- Browser console for specific errors
- CORS headers configuration
