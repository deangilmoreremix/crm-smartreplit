# Module Federation Setup Checklist for Bolt App

## Issue Identified
Your remoteEntry.js loads successfully but doesn't create a global `ContactsApp` container. This means the Module Federation configuration isn't working properly.

## Required Files in Your Bolt App

### 1. package.json
Add this dependency:
```json
{
  "devDependencies": {
    "@originjs/vite-plugin-federation": "^1.3.5"
  }
}
```

### 2. vite.config.js (CRITICAL - Replace completely)
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'ContactsApp',
      filename: 'remoteEntry.js',
      exposes: {
        './ContactsApp': './src/ContactsApp.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
      },
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    cors: true,
  },
});
```

### 3. src/ContactsApp.tsx (Create this exact file)
```tsx
import React from 'react';

const ContactsApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', border: '2px solid green', borderRadius: '8px' }}>
      <h2>🎉 Module Federation Success!</h2>
      <p>This is your remote contacts app from Bolt.</p>
      <p>You can now replace this with your actual contacts component.</p>
    </div>
  );
};

export default ContactsApp;
```

## Steps to Fix

1. **Install dependency**: `npm install @originjs/vite-plugin-federation`
2. **Replace vite.config.js** with the exact code above
3. **Create src/ContactsApp.tsx** with the exact code above
4. **Build and deploy**: `npm run build` then deploy
5. **Test**: The connection should work

## Verification
After deploying, check that:
- `yourapp.com/assets/remoteEntry.js` loads without errors
- The browser console shows `window.ContactsApp` exists
- No "Script error" messages appear

## Common Issues
- Missing @originjs/vite-plugin-federation dependency
- Wrong vite.config.js syntax
- Missing or wrong export in ContactsApp.tsx
- Build cache issues (try `rm -rf dist && npm run build`)