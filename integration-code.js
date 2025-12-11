// CRM Integration Bridge for Your React App
// Add this code to your React app at https://cheery-syrniki-b5b6ca.netlify.app

class CRMBridge {
  constructor() {
    this.parentOrigin = null; // Will be set automatically when parent connects
    this.isConnected = false;
    this.setupMessageListener();
    this.notifyReady();
    console.log('🔗 CRM Bridge initialized in remote app');
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Set parent origin on first message from CRM
      if (!this.parentOrigin && event.origin && event.data?.source === 'CRM') {
        this.parentOrigin = event.origin;
        console.log('🏠 Parent CRM origin set:', this.parentOrigin);
      }

      // Verify parent origin for security
      if (!this.isValidOrigin(event.origin)) {
        return;
      }

      const { type, data, source } = event.data;
      if (source !== 'CRM') return;

      console.log('📨 Remote app received from CRM:', type, data);

      switch (type) {
        case 'CRM_INIT':
          this.handleCRMInit(data);
          break;
        case 'SYNC_DEALS':
          this.handleDealsSync(data.deals);
          break;
        case 'UPDATE_DEAL':
          this.handleDealUpdate(data.dealId, data.updates);
          break;
        case 'CREATE_DEAL':
          this.handleDealCreate(data.deal);
          break;
        case 'DELETE_DEAL':
          this.handleDealDelete(data.dealId);
          break;
        case 'MOVE_DEAL':
          this.handleDealMove(data.dealId, data.newStage, data.position);
          break;
        case 'REQUEST_PIPELINE_DATA':
          this.sendPipelineData();
          break;
        case 'INJECT_BRIDGE':
          // CRM is sending us bridge code - we already have it
          console.log('✅ Bridge code injection acknowledged');
          break;
      }
    });
  }

  isValidOrigin(origin) {
    // Add your CRM domains here - the bridge will auto-detect the parent origin
    if (!this.parentOrigin) return true; // Allow first connection
    return origin === this.parentOrigin;
  }

  // Send message to CRM parent
  sendToCRM(type, data = null) {
    if (!this.parentOrigin) {
      console.warn('⚠️ Cannot send to CRM - no parent origin set');
      return;
    }

    const message = {
      type,
      data,
      source: 'REMOTE_PIPELINE',
      timestamp: Date.now()
    };

    try {
      window.parent.postMessage(message, this.parentOrigin);
      console.log('📤 Sent to CRM:', type, data);
    } catch (error) {
      console.error('❌ Failed to send message to CRM:', error);
    }
  }

  // Notify CRM that this app is ready
  notifyReady() {
    setTimeout(() => {
      console.log('📢 Notifying CRM that remote app is ready');
      this.sendToCRM('REMOTE_READY', {
        appName: 'Remote Pipeline',
        version: '1.0.0',
        capabilities: ['deals', 'pipeline', 'analytics']
      });
    }, 1000);
  }

  // Handle CRM initialization
  handleCRMInit(data) {
    console.log('🚀 CRM connected with data:', data);
    this.isConnected = true;
    
    const { pipelineData, crmInfo } = data;
    
    // Update your app with CRM data
    if (pipelineData) {
      this.updateLocalPipeline(pipelineData);
    }
    
    // Show connection status in your UI
    this.updateConnectionStatus(true, crmInfo);
  }

  // Handle deals synchronization from CRM
  handleDealsSync(deals) {
    console.log('🔄 Syncing deals from CRM:', deals);
    
    // Update your local state with CRM deals
    this.updateLocalDeals(deals);
  }

  // Handle individual deal updates from CRM
  handleDealUpdate(dealId, updates) {
    console.log('✏️ Deal updated from CRM:', dealId, updates);
    
    // Update specific deal in your local state
    this.updateLocalDeal(dealId, updates);
  }

  // Handle new deal creation from CRM
  handleDealCreate(deal) {
    console.log('🆕 New deal from CRM:', deal);
    
    // Add deal to your local state
    this.addLocalDeal(deal);
  }

  // Handle deal deletion from CRM
  handleDealDelete(dealId) {
    console.log('🗑️ Deal deleted in CRM:', dealId);
    
    // Remove deal from your local state
    this.removeLocalDeal(dealId);
  }

  // Handle deal stage movement from CRM
  handleDealMove(dealId, newStage, position) {
    console.log('↔️ Deal moved in CRM:', dealId, 'to', newStage);
    
    // Update deal stage in your local state
    this.moveLocalDeal(dealId, newStage, position);
  }

  // Send current pipeline data to CRM
  sendPipelineData() {
    console.log('📊 CRM requested pipeline data');
    
    // Get your current pipeline data
    const pipelineData = this.getCurrentPipelineData();
    
    this.sendToCRM('PIPELINE_DATA_RESPONSE', pipelineData);
  }

  // === METHODS TO IMPLEMENT IN YOUR REACT APP ===

  updateLocalPipeline(pipelineData) {
    // TODO: Implement this method to update your React app's state
    // Example:
    // setPipelineData(pipelineData);
    console.log('📝 TODO: Update local pipeline with:', pipelineData);
  }

  updateLocalDeals(deals) {
    // TODO: Implement this method to sync all deals
    // Example:
    // setDeals(deals);
    console.log('📝 TODO: Update local deals with:', deals);
  }

  updateLocalDeal(dealId, updates) {
    // TODO: Implement this method to update a specific deal
    // Example:
    // setDeals(prev => prev.map(deal => 
    //   deal.id === dealId ? { ...deal, ...updates } : deal
    // ));
    console.log('📝 TODO: Update local deal:', dealId, updates);
  }

  addLocalDeal(deal) {
    // TODO: Implement this method to add a new deal
    // Example:
    // setDeals(prev => [...prev, deal]);
    console.log('📝 TODO: Add local deal:', deal);
  }

  removeLocalDeal(dealId) {
    // TODO: Implement this method to remove a deal
    // Example:
    // setDeals(prev => prev.filter(deal => deal.id !== dealId));
    console.log('📝 TODO: Remove local deal:', dealId);
  }

  moveLocalDeal(dealId, newStage, position) {
    // TODO: Implement this method to move a deal between stages
    // Example:
    // setDeals(prev => prev.map(deal => 
    //   deal.id === dealId ? { ...deal, stage: newStage } : deal
    // ));
    console.log('📝 TODO: Move local deal:', dealId, 'to', newStage);
  }

  updateConnectionStatus(connected, crmInfo = null) {
    // TODO: Implement this method to show connection status in your UI
    // Example:
    // setConnectionStatus({ connected, crmInfo });
    console.log('📝 TODO: Update connection status:', connected, crmInfo);
  }

  getCurrentPipelineData() {
    // TODO: Implement this method to return your current pipeline data
    // Example:
    // return {
    //   deals: deals,
    //   stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'],
    //   totalValue: deals.reduce((sum, deal) => sum + deal.value, 0),
    //   activeDeals: deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length
    // };
    console.log('📝 TODO: Return current pipeline data');
    return {
      deals: [],
      stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      totalValue: 0,
      activeDeals: 0
    };
  }

  // === METHODS TO CALL FROM YOUR REACT APP ===

  // Call this when user creates a deal in your app
  notifyDealCreated(deal) {
    this.sendToCRM('DEAL_CREATED', deal);
  }

  // Call this when user updates a deal in your app
  notifyDealUpdated(deal) {
    this.sendToCRM('DEAL_UPDATED', deal);
  }

  // Call this when user deletes a deal in your app
  notifyDealDeleted(dealId) {
    this.sendToCRM('DEAL_DELETED', { id: dealId });
  }

  // Call this when user moves a deal between stages in your app
  notifyDealMoved(dealId, oldStage, newStage) {
    this.sendToCRM('DEAL_STAGE_CHANGED', { dealId, oldStage, newStage });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      parentOrigin: this.parentOrigin
    };
  }
}

// Initialize the bridge when the page loads
window.crmBridge = new CRMBridge();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CRMBridge;
}