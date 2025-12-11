# Remote Contacts Module Integration Guide

This guide explains how to integrate your remote contacts module (https://taupe-sprinkles-83c9ee.netlify.app) with the CRM system using postMessage communication.

## Overview

The CRM system can now communicate bidirectionally with your remote contacts module through secure postMessage APIs. This allows:

- Syncing contacts between remote module and CRM
- Real-time updates when contacts are created/updated/deleted
- Shared state management
- Authentication and permissions integration

## Integration Setup

### 1. CRM Side (Already Implemented)

The CRM automatically:
- Sends initial contact data when the remote module loads
- Listens for contact changes from the remote module
- Updates local CRM data when remote contacts change
- Provides connection status indicators

### 2. Remote Module Side (Implementation Needed)

Add this JavaScript code to your remote contacts module:

```javascript
// CRM Integration Bridge for Remote Contacts Module
class CRMBridge {
  constructor() {
    this.parentOrigin = window.location.ancestorOrigins?.[0] || 'https://your-crm-domain.replit.app';
    this.isConnected = false;
    this.setupMessageListener();
    this.notifyReady();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Verify parent origin for security
      if (!this.isValidOrigin(event.origin)) {
        return;
      }

      const { type, data } = event.data;
      console.log('📨 Remote module received:', type, data);

      switch (type) {
        case 'CRM_INIT':
          this.handleCRMInit(data);
          break;
        case 'CONTACTS_SYNC':
          this.handleContactsSync(data.contacts);
          break;
        case 'LOCAL_CONTACT_CREATED':
          this.handleLocalContactCreated(data);
          break;
        case 'LOCAL_CONTACT_UPDATED':
          this.handleLocalContactUpdated(data);
          break;
        case 'LOCAL_CONTACT_DELETED':
          this.handleLocalContactDeleted(data);
          break;
      }
    });
  }

  isValidOrigin(origin) {
    const allowedOrigins = [
      'https://your-crm-domain.replit.app',
      'http://localhost:5000',
      // Add your CRM domains here
    ];
    return allowedOrigins.includes(origin);
  }

  notifyReady() {
    this.sendToCRM('REMOTE_READY', { 
      moduleInfo: {
        name: 'Remote Contacts',
        version: '1.0.0',
        capabilities: ['create', 'read', 'update', 'delete']
      }
    });
  }

  handleCRMInit(data) {
    console.log('🚀 CRM initialized:', data);
    this.isConnected = true;
    
    // Load CRM contacts into your remote module
    if (data.contacts) {
      this.loadContactsFromCRM(data.contacts);
    }
  }

  handleContactsSync(contacts) {
    console.log('🔄 Syncing contacts from CRM:', contacts.length);
    this.loadContactsFromCRM(contacts);
  }

  // Implement these methods based on your remote module structure
  loadContactsFromCRM(contacts) {
    // Update your remote module's contact list
    // Example: this.contactStore.setContacts(contacts);
  }

  handleLocalContactCreated(contact) {
    // Add the contact to your remote module
    // Example: this.contactStore.addContact(contact);
  }

  handleLocalContactUpdated(contact) {
    // Update the contact in your remote module
    // Example: this.contactStore.updateContact(contact);
  }

  handleLocalContactDeleted(data) {
    // Remove the contact from your remote module
    // Example: this.contactStore.deleteContact(data.id);
  }

  // Call these methods when contacts change in your remote module
  notifyContactCreated(contact) {
    this.sendToCRM('CONTACT_CREATED', contact);
  }

  notifyContactUpdated(contact) {
    this.sendToCRM('CONTACT_UPDATED', contact);
  }

  notifyContactDeleted(contactId) {
    this.sendToCRM('CONTACT_DELETED', { id: contactId });
  }

  requestCRMContacts() {
    this.sendToCRM('REQUEST_CONTACTS', {});
  }

  sendToCRM(type, data) {
    if (window.parent) {
      window.parent.postMessage({ type, data }, this.parentOrigin);
      console.log('📤 Sent to CRM:', type, data);
    }
  }
}

// Initialize the bridge
const crmBridge = new CRMBridge();
```

### 3. Contact Data Format

Use this standardized format for contact data:

```javascript
const contact = {
  id: 'unique-id',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  position: 'Manager',
  tags: ['lead', 'potential'],
  notes: 'Met at conference',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};
```

## Available Message Types

### From CRM to Remote Module
- `CRM_INIT` - Initial connection with contact data
- `CONTACTS_SYNC` - Full contact synchronization
- `LOCAL_CONTACT_CREATED` - A contact was created in CRM
- `LOCAL_CONTACT_UPDATED` - A contact was updated in CRM
- `LOCAL_CONTACT_DELETED` - A contact was deleted in CRM
- `NAVIGATION_AVAILABLE` - Available CRM routes for navigation

### From Remote Module to CRM
- `REMOTE_READY` - Remote module is loaded and ready
- `CONTACT_CREATED` - A contact was created in remote module
- `CONTACT_UPDATED` - A contact was updated in remote module
- `CONTACT_DELETED` - A contact was deleted in remote module
- `REQUEST_CONTACTS` - Request current CRM contact data
- `SYNC_REQUEST` - Request full synchronization
- `NAVIGATE` - Navigate to a specific CRM route
- `NAVIGATE_BACK` - Navigate back in browser history
- `NAVIGATE_TO_DASHBOARD` - Navigate to CRM dashboard

## Testing the Integration

1. Open browser DevTools on the CRM page
2. Navigate to the Contacts page
3. Look for bridge messages in the console:
   - `🔗 Bridge received message:` - Messages from remote module
   - `📤 Bridge sending message:` - Messages to remote module
   - Connection status indicators in the UI

## Security Considerations

- Origin validation ensures only trusted domains can communicate
- All messages are logged for debugging
- Iframe sandbox restrictions prevent malicious code execution
- No sensitive data like API keys are transmitted

## Next Steps

1. Add the CRMBridge JavaScript code to your remote contacts module
2. Update the allowed origins list with your actual CRM domain
3. Implement the contact loading/updating methods for your specific UI
4. Test the bidirectional communication
5. Add error handling and offline support as needed