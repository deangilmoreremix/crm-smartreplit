/**
 * Simplified Remote App Navigation Bridge
 * Add this code to each remote app to enable navigation control of the parent CRM
 * 
 * This is a simplified version that focuses on navigation without complex data sync
 * Usage: Copy this entire code block into each remote app's main JavaScript file
 */

class RemoteNavigationBridge {
  constructor() {
    this.parentOrigin = '*'; // Change to specific domain in production: 'https://your-crm-domain.com'
    this.isConnected = false;
    this.messageQueue = [];
    
    this.initBridge();
    this.setupMessageListener();
  }

  initBridge() {
    // Send ready signal to parent
    this.sendToParent({
      type: 'REMOTE_APP_READY',
      timestamp: Date.now(),
      appName: this.getAppName()
    });

    // Set up connection timeout
    setTimeout(() => {
      if (!this.isConnected) {
        console.warn('Remote navigation bridge: Connection timeout');
      }
    }, 5000);
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Validate origin in production
      // if (event.origin !== 'https://your-crm-domain.com') return;

      const { type, data } = event.data;

      switch (type) {
        case 'BRIDGE_CONNECTED':
          this.isConnected = true;
          console.log('Remote navigation bridge connected');
          this.flushMessageQueue();
          break;

        case 'NAVIGATION_SYNC':
          this.handleNavigationSync(data);
          break;

        case 'DATA_REQUEST':
          this.handleDataRequest(data);
          break;
      }
    });
  }

  // Navigation Methods - Call these from your remote app
  navigateToContacts() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/contacts'
    });
  }

  navigateToDashboard() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/dashboard'
    });
  }

  navigateToDeals() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/deals'
    });
  }

  navigateToTasks() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/tasks'
    });
  }

  navigateToCalendar() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/calendar'
    });
  }

  navigateToSettings() {
    this.sendToParent({
      type: 'NAVIGATE',
      route: '/settings'
    });
  }

  // Custom route navigation
  navigateToRoute(route) {
    this.sendToParent({
      type: 'NAVIGATE',
      route: route
    });
  }

  // Data Sync Methods
  syncContactData(contacts) {
    this.sendToParent({
      type: 'SYNC_CONTACTS',
      data: contacts
    });
  }

  syncDealData(deals) {
    this.sendToParent({
      type: 'SYNC_DEALS',
      data: deals
    });
  }

  syncTaskData(tasks) {
    this.sendToParent({
      type: 'SYNC_TASKS',
      data: tasks
    });
  }

  // Request data from parent CRM
  requestContactData() {
    this.sendToParent({
      type: 'REQUEST_CONTACTS'
    });
  }

  requestDealData() {
    this.sendToParent({
      type: 'REQUEST_DEALS'
    });
  }

  requestUserData() {
    this.sendToParent({
      type: 'REQUEST_USER_DATA'
    });
  }

  // Status and notification methods
  showNotification(message, type = 'info') {
    this.sendToParent({
      type: 'SHOW_NOTIFICATION',
      data: { message, type }
    });
  }

  updateConnectionStatus(status) {
    this.sendToParent({
      type: 'CONNECTION_STATUS',
      data: { status, timestamp: Date.now() }
    });
  }

  // Internal methods
  sendToParent(message) {
    if (!this.isConnected) {
      this.messageQueue.push(message);
      return;
    }

    try {
      window.parent.postMessage(message, this.parentOrigin);
    } catch (error) {
      console.error('Failed to send message to parent:', error);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendToParent(message);
    }
  }

  handleNavigationSync(data) {
    // Handle navigation state sync from parent
    console.log('Navigation sync received:', data);
    
    // Update your app's internal navigation state here
    // Example: this.updateInternalRoute(data.currentRoute);
  }

  handleDataRequest(data) {
    // Handle data requests from parent
    console.log('Data request received:', data);
    
    // Respond with requested data
    // Example: this.sendLocalData(data.requestType);
  }

  getAppName() {
    // Return your app's identifier
    const hostname = window.location.hostname;
    
    if (hostname.includes('moonlit-tarsier')) {
      return 'white-label-suite';
    } else if (hostname.includes('clever-syrniki')) {
      return 'product-research';
    } else if (hostname.includes('resilient-frangipane')) {
      return 'ai-analytics';
    } else if (hostname.includes('taupe-sprinkles')) {
      return 'contacts';
    } else if (hostname.includes('cheery-syrniki')) {
      return 'pipeline';
    }
    
    return 'unknown-app';
  }
}

// Initialize the bridge when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.remoteBridge = new RemoteNavigationBridge();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.remoteBridge = new RemoteNavigationBridge();
  });
} else {
  window.remoteBridge = new RemoteNavigationBridge();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RemoteNavigationBridge;
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Navigate to different CRM sections:
 *    window.remoteBridge.navigateToContacts();
 *    window.remoteBridge.navigateToDashboard();
 *    window.remoteBridge.navigateToDeals();
 * 
 * 2. Sync data with parent CRM:
 *    window.remoteBridge.syncContactData([{name: 'John', email: 'john@example.com'}]);
 *    window.remoteBridge.syncDealData([{title: 'Big Deal', value: 10000}]);
 * 
 * 3. Request data from parent:
 *    window.remoteBridge.requestContactData();
 *    window.remoteBridge.requestDealData();
 * 
 * 4. Show notifications in parent:
 *    window.remoteBridge.showNotification('Action completed!', 'success');
 *    window.remoteBridge.showNotification('Error occurred', 'error');
 * 
 * 5. Custom navigation:
 *    window.remoteBridge.navigateToRoute('/custom-page');
 */