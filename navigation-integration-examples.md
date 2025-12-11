# Remote App Navigation Integration Guide

## Quick Setup for Each Remote App

### 1. White Label Suite (https://moonlit-tarsier-239e70.netlify.app)

Add this to your main HTML file or JavaScript entry point:

```html
<!-- Add to <head> or before closing </body> tag -->
<script src="./remote-navigation-bridge.js"></script>

<script>
// Example: Add navigation buttons to your app
function addNavigationButtons() {
  const navContainer = document.createElement('div');
  navContainer.className = 'crm-navigation';
  navContainer.innerHTML = `
    <button onclick="window.remoteBridge.navigateToDashboard()">Dashboard</button>
    <button onclick="window.remoteBridge.navigateToContacts()">Contacts</button>
    <button onclick="window.remoteBridge.navigateToDeals()">Deals</button>
    <button onclick="window.remoteBridge.navigateToTasks()">Tasks</button>
    <button onclick="window.remoteBridge.navigateToCalendar()">Calendar</button>
  `;
  
  // Add to your app's header or navigation area
  document.body.insertBefore(navContainer, document.body.firstChild);
}

// Initialize navigation when app loads
document.addEventListener('DOMContentLoaded', addNavigationButtons);
</script>
```

### 2. Product Research Module (https://clever-syrniki-4df87f.netlify.app)

```html
<script src="./remote-navigation-bridge.js"></script>

<script>
// Example: Integrate with your existing UI
function setupCRMIntegration() {
  // Add CRM navigation to existing toolbar
  const toolbar = document.querySelector('.toolbar') || document.querySelector('nav');
  if (toolbar) {
    const crmButton = document.createElement('button');
    crmButton.textContent = 'CRM Dashboard';
    crmButton.onclick = () => window.remoteBridge.navigateToDashboard();
    toolbar.appendChild(crmButton);
  }

  // Sync research data back to CRM
  function syncResearchData(productData) {
    window.remoteBridge.syncContactData(productData.contacts);
    window.remoteBridge.showNotification('Research data synced!', 'success');
  }
}

document.addEventListener('DOMContentLoaded', setupCRMIntegration);
</script>
```

### 3. AI Analytics Dashboard (https://resilient-frangipane-6289c8.netlify.app)

```html
<script src="./remote-navigation-bridge.js"></script>

<script>
// Example: Add navigation menu to analytics dashboard
function addCRMMenu() {
  const menuHTML = `
    <div class="crm-menu" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
      <select onchange="navigateFromAnalytics(this.value)">
        <option value="">Navigate to CRM...</option>
        <option value="dashboard">Dashboard</option>
        <option value="contacts">Contacts</option>
        <option value="deals">Deals</option>
        <option value="tasks">Tasks</option>
        <option value="calendar">Calendar</option>
      </select>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
}

function navigateFromAnalytics(route) {
  if (route) {
    window.remoteBridge.navigateToRoute('/' + route);
  }
}

document.addEventListener('DOMContentLoaded', addCRMMenu);
</script>
```

## Advanced Integration Examples

### Data Synchronization

```javascript
// Example: Sync data when user performs actions
function onContactCreated(contact) {
  // Sync new contact to CRM
  window.remoteBridge.syncContactData([contact]);
  
  // Show success notification in CRM
  window.remoteBridge.showNotification(
    `Contact ${contact.name} created successfully!`, 
    'success'
  );
}

function onDealUpdated(deal) {
  // Sync deal changes to CRM
  window.remoteBridge.syncDealData([deal]);
  
  // Navigate to deals page to show updated deal
  window.remoteBridge.navigateToDeals();
}
```

### Request CRM Data

```javascript
// Example: Load CRM data into your remote app
function loadCRMData() {
  // Request current contacts
  window.remoteBridge.requestContactData();
  
  // Request current deals
  window.remoteBridge.requestDealData();
  
  // Request user information
  window.remoteBridge.requestUserData();
}

// Handle data received from CRM
window.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CONTACTS_DATA':
      updateContactsList(data);
      break;
    case 'DEALS_DATA':
      updateDealsList(data);
      break;
    case 'USER_DATA':
      updateUserProfile(data);
      break;
  }
});
```

### React Integration Example

```jsx
// For React-based remote apps
import { useEffect, useRef } from 'react';

function CRMNavigationComponent() {
  const bridgeRef = useRef(null);
  
  useEffect(() => {
    // Initialize bridge
    if (window.remoteBridge) {
      bridgeRef.current = window.remoteBridge;
    }
  }, []);
  
  const handleNavigate = (route) => {
    if (bridgeRef.current) {
      bridgeRef.current.navigateToRoute(route);
    }
  };
  
  return (
    <div className="crm-navigation">
      <button onClick={() => handleNavigate('/dashboard')}>
        Dashboard
      </button>
      <button onClick={() => handleNavigate('/contacts')}>
        Contacts
      </button>
      <button onClick={() => handleNavigate('/deals')}>
        Deals
      </button>
    </div>
  );
}
```

## Styling the Navigation

```css
/* Add this CSS to style your CRM navigation */
.crm-navigation {
  background: #f8f9fa;
  padding: 10px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
  align-items: center;
}

.crm-navigation button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.crm-navigation button:hover {
  background: #0056b3;
}

.crm-menu select {
  background: white;
  border: 1px solid #ccc;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}
```

## Installation Steps

1. **Copy the bridge code**: Save `remote-navigation-bridge.js` to each remote app
2. **Include the script**: Add `<script src="./remote-navigation-bridge.js"></script>` to your HTML
3. **Add navigation UI**: Use the examples above to add navigation buttons/menus
4. **Test integration**: Verify navigation works between apps and CRM

## Available Navigation Routes

- `/dashboard` - Main CRM dashboard
- `/contacts` - Contacts management
- `/deals` - Deal pipeline
- `/tasks` - Task management  
- `/calendar` - Calendar/appointments
- `/settings` - CRM settings
- Any custom route you define

The bridge automatically handles connection status, message queuing, and error handling for seamless integration.