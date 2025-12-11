// Example React Component Integration
// This shows how to use the CRM bridge in your React components

import React, { useState, useEffect } from 'react';

function YourPipelineComponent() {
  const [deals, setDeals] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false });
  const [crmBridge, setCrmBridge] = useState(null);

  useEffect(() => {
    // Wait for the CRM bridge to be available
    const checkBridge = () => {
      if (window.crmBridge) {
        setCrmBridge(window.crmBridge);
        
        // Override the bridge methods to update React state
        window.crmBridge.updateLocalDeals = (newDeals) => {
          setDeals(newDeals);
        };

        window.crmBridge.updateLocalDeal = (dealId, updates) => {
          setDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, ...updates } : deal
          ));
        };

        window.crmBridge.addLocalDeal = (deal) => {
          setDeals(prev => [...prev, deal]);
        };

        window.crmBridge.removeLocalDeal = (dealId) => {
          setDeals(prev => prev.filter(deal => deal.id !== dealId));
        };

        window.crmBridge.moveLocalDeal = (dealId, newStage, position) => {
          setDeals(prev => prev.map(deal => 
            deal.id === dealId ? { ...deal, stage: newStage } : deal
          ));
        };

        window.crmBridge.updateConnectionStatus = (connected, crmInfo) => {
          setConnectionStatus({ connected, crmInfo });
        };

        window.crmBridge.getCurrentPipelineData = () => {
          return {
            deals: deals,
            stages: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
            totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
            activeDeals: deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length
          };
        };

        console.log('✅ CRM Bridge integrated with React component');
      } else {
        // Bridge not ready, try again
        setTimeout(checkBridge, 100);
      }
    };

    checkBridge();
  }, [deals]); // Re-run when deals change to update getCurrentPipelineData

  // Example: Handle creating a new deal in your app
  const handleCreateDeal = (newDeal) => {
    const dealWithId = {
      ...newDeal,
      id: Date.now().toString(), // Generate ID
      createdAt: new Date().toISOString()
    };
    
    // Update local state
    setDeals(prev => [...prev, dealWithId]);
    
    // Notify CRM
    if (crmBridge) {
      crmBridge.notifyDealCreated(dealWithId);
    }
  };

  // Example: Handle updating a deal in your app
  const handleUpdateDeal = (dealId, updates) => {
    // Update local state
    setDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, ...updates } : deal
    ));
    
    // Notify CRM
    if (crmBridge) {
      const updatedDeal = deals.find(d => d.id === dealId);
      if (updatedDeal) {
        crmBridge.notifyDealUpdated({ ...updatedDeal, ...updates });
      }
    }
  };

  // Example: Handle moving a deal between stages
  const handleMoveDeal = (dealId, newStage) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const oldStage = deal.stage;
    
    // Update local state
    setDeals(prev => prev.map(d => 
      d.id === dealId ? { ...d, stage: newStage } : d
    ));
    
    // Notify CRM
    if (crmBridge) {
      crmBridge.notifyDealMoved(dealId, oldStage, newStage);
    }
  };

  return (
    <div className="pipeline-component">
      {/* Connection Status */}
      <div className="connection-status">
        {connectionStatus.connected ? (
          <span style={{ color: 'green' }}>🟢 Connected to CRM</span>
        ) : (
          <span style={{ color: 'gray' }}>🔶 Standalone Mode</span>
        )}
        {connectionStatus.crmInfo && (
          <span> - {connectionStatus.crmInfo.name} v{connectionStatus.crmInfo.version}</span>
        )}
      </div>

      {/* Your pipeline UI here */}
      <div className="deals-list">
        {deals.map(deal => (
          <div key={deal.id} className="deal-card">
            <h3>{deal.title}</h3>
            <p>Value: ${deal.value}</p>
            <p>Stage: {deal.stage}</p>
            <button onClick={() => handleUpdateDeal(deal.id, { value: deal.value + 1000 })}>
              Add $1000
            </button>
            <button onClick={() => handleMoveDeal(deal.id, 'Negotiation')}>
              Move to Negotiation
            </button>
          </div>
        ))}
      </div>

      {/* Add new deal button */}
      <button onClick={() => handleCreateDeal({
        title: 'New Deal',
        value: 5000,
        stage: 'Lead',
        contactName: 'Test Contact'
      })}>
        Add New Deal
      </button>
    </div>
  );
}

export default YourPipelineComponent;