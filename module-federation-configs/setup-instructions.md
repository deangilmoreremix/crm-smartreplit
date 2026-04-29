# Module Federation Setup Instructions

## Overview

These configuration files will enable your external apps to work as Module Federation remotes with your CRM system.

## For Each External App

### 1. Install Dependencies

```bash
npm install @originjs/vite-plugin-federation
```

### 2. Replace vite.config.js

- **Contacts App** (`https://taupe-sprinkles-83c9ee.netlify.app`): Use `contacts-app-vite.config.js`
- **Pipeline App** (`https://cheery-syrniki-b5b6ca.netlify.app`): Use `pipeline-app-vite.config.js`
- **Analytics App** (`https://resilient-frangipane-6289c8.netlify.app`): Use `analytics-app-vite.config.js`
- **AI Calendar App** (`https://calendar.smartcrm.vip`): Use `calendar-app-vite.config.js`

### 3. Add Exposed Components

- **Contacts App**: Add `ContactsApp.tsx` to `src/` folder
- **Pipeline App**: Add `PipelineApp.tsx` to `src/` folder
- **Analytics App**: Add `AnalyticsApp.tsx` to `src/` folder
- **AI Calendar App**: Add `CalendarApp.tsx` to `src/` folder

### 4. Update Main Entry Point

Modify your main `src/App.tsx` or create a new entry point that exports the Module Federation component:

```tsx
// Example for analytics app
import AnalyticsApp from './AnalyticsApp';

// Export for Module Federation
export default AnalyticsApp;

// Also render normally for standalone use
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root')!);
root.render(<AnalyticsApp />);
```

### 5. Update Authentication to Use Shared State

**IMPORTANT**: When loaded as Module Federation remotes, apps should use the shared authentication state from the parent CRM instead of their own authentication system.

Update your app components to check for `sharedData.user` and `sharedData.isAuthenticated` first before falling back to local authentication:

```tsx
// In your app component (ContactsApp, PipelineApp, etc.)
const YourApp: React.FC<{ sharedData?: any }> = ({ sharedData }) => {
  // Check if we have authentication from parent app
  const isAuthenticatedViaParent = sharedData?.isAuthenticated && sharedData?.user;
  const userFromParent = sharedData?.user;

  // If authenticated via parent, skip local auth checks
  if (isAuthenticatedViaParent) {
    return <YourMainComponent user={userFromParent} />;
  }

  // Fallback to local authentication for standalone use
  return <YourAuthComponent />;
};
```

For Supabase-based apps, still include environment variables for standalone deployment:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Build and Deploy

```bash
npm run build
```

**Important for Analytics App:** Deploy with the `_headers` file to allow public access to `remoteEntry.js`:

- Copy `_headers` to your build output directory (usually `dist/`)
- Or configure your deployment platform (Netlify/Vercel) to allow public access to `/assets/*`

After deployment, each app will expose:

- `https://contacts.smartcrm.vip/assets/remoteEntry.js`
- `https://pipeline.smartcrm.vip/assets/remoteEntry.js`
- `https://ai-analytics.smartcrm.vip/assets/remoteEntry.js`
- `https://calendar.smartcrm.vip/assets/remoteEntry.js`

## Testing Module Federation

After setup, your CRM will be able to load these as proper Module Federation remotes instead of iframes:

```tsx
// In your CRM
import { loadRemoteComponent } from '../utils/dynamicModuleFederation';

const ContactsModule = await loadRemoteComponent(
  'https://taupe-sprinkles-83c9ee.netlify.app',
  'ContactsApp',
  './ContactsApp'
);
```

## Communication Protocol

The exposed components communicate with the parent CRM via:

1. **PostMessage API** for cross-origin communication
2. **Event-based messaging** for real-time updates
3. **Props interface** for initial data and callbacks

### Message Types:

- `CONTACTS_MODULE_READY` / `PIPELINE_MODULE_READY` / `ANALYTICS_MODULE_READY`
- `CONTACT_CREATED` / `DEAL_UPDATED` / `INSIGHT_GENERATED`
- `CRM_CONTACTS_SYNC` / `CRM_DEALS_SYNC` / `CRM_ANALYTICS_SYNC`

## Troubleshooting

1. **CORS Issues**: Ensure the config includes proper CORS headers
2. **Build Errors**: Make sure `@originjs/vite-plugin-federation` is installed
3. **Runtime Errors**: Check browser console for Module Federation loading errors
4. **Component Not Found**: Verify the exposed paths match the actual file structure

## Next Steps

Once all apps are updated and deployed:

1. Test each `remoteEntry.js` URL directly
2. Update your CRM's Module Federation consumption code
3. Verify real-time communication between apps
4. Monitor performance and optimize as needed
