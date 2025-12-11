# Bolt Contacts App Setup for Module Federation

## Step 1: Install Federation Plugin
In your Bolt contacts app, run:
```bash
npm install @originjs/vite-plugin-federation --save-dev
```

## Step 2: Replace vite.config.js
Replace your entire `vite.config.js` with:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'contacts_remote',
      filename: 'remoteEntry.js',
      exposes: {
        './ContactsApp': './src/ContactsApp.tsx',
        './ContactModal': './src/ContactModal.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  build: {
    target: 'esnext'
  }
})
```

## Step 3: Create ContactsApp.tsx Wrapper
Create `/src/ContactsApp.tsx` in your Bolt app:
```typescript
// src/ContactsApp.tsx
import React from 'react';

export interface ContactsAppProps {
  onContactSelect?: (contact: any) => void;
  onContactCreate?: (contact: any) => void;
  onContactUpdate?: (contact: any) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: any[];
  theme?: 'light' | 'dark';
}

const ContactsApp: React.FC<ContactsAppProps> = ({
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  initialContacts,
  theme = 'light'
}) => {
  // Wrap your existing contacts component here
  // Pass the props to handle communication with parent app
  
  return (
    <div className={`contacts-remote-wrapper ${theme}`}>
      {/* Your existing contacts component */}
      {/* Make sure to call the callback props when actions happen */}
    </div>
  );
};

export default ContactsApp;
```

## Step 4: Build and Deploy
```bash
npm run build
```

Deploy your Bolt app to Vercel/Netlify and get the URL.

## Step 5: Use in Replit
In your Replit app, go to `/contacts` and use the remote settings panel to:
1. Enter your deployed Bolt app URL
2. Check "Use remote contacts app"

The system will automatically load your Bolt contacts via Module Federation!