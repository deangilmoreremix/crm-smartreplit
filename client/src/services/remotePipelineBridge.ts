// Remote Pipeline Bridge Service
// Manages communication between CRM and remote pipeline module

export interface RemotePipelineStatus {
  isConnected: boolean;
  lastSync: Date | null;
  dealCount: number;
  errorMessage?: string;
  connectionAttempts: number;
}

export interface PipelineMessage {
  type: string;
  data: any;
  source: string;
  timestamp: number;
}

export interface CRMDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId?: string;
  contactName?: string;
  company?: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CRMPipelineData {
  deals: CRMDeal[];
  stages: {
    id: string;
    name: string;
    order: number;
    color?: string;
  }[];
}

export class RemotePipelineBridge {
  private iframe: HTMLIFrameElement | null = null;
  private status: RemotePipelineStatus;
  private statusCallback: (status: RemotePipelineStatus) => void;
  private maxAttempts = 3;
  private retryDelay = 2000;
  private messageHandler: (event: MessageEvent) => void;
  private messageCallbacks: ((data: any) => void)[] = [];

  constructor(statusCallback: (status: RemotePipelineStatus) => void) {
    this.statusCallback = statusCallback;
    this.status = {
      isConnected: false,
      lastSync: null,
      dealCount: 0,
      connectionAttempts: 0
    };
    
    // Store bound message handler for proper cleanup
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  }

  setIframe(iframe: HTMLIFrameElement | null) {
    this.iframe = iframe;
  }

  private handleMessage(event: MessageEvent) {
    // Security check for allowed origins
    const allowedOrigins = [
      'https://cheery-syrniki-b5b6ca.netlify.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!allowedOrigins.some(origin => event.origin.includes(origin.replace('https://', '').replace('http://', '')))) {
      return;
    }

    try {
      const message: PipelineMessage = event.data;
      if (!message || message.source !== 'REMOTE_PIPELINE') return;

      console.log('📨 Remote pipeline message received:', message.type);

      switch (message.type) {
        case 'REMOTE_READY':
          console.log('🎯 Remote pipeline ready, initializing...');
          this.updateStatus({ connectionAttempts: this.status.connectionAttempts + 1 });
          this.initializePipeline();
          break;
          
        case 'CRM_INIT_COMPLETE':
          this.updateStatus({
            isConnected: true,
            lastSync: new Date(),
            dealCount: message.data?.dealsReceived || 0
          });
          console.log('✅ Remote pipeline initialized successfully');
          break;
          
        case 'BRIDGE_READY':
          // Bridge code is loaded and ready
          this.updateStatus({ connectionAttempts: this.status.connectionAttempts + 1 });
          setTimeout(() => this.initializePipeline(), 500);
          break;
          
        case 'DEAL_UPDATED':
        case 'DEAL_CREATED':
        case 'DEAL_DELETED':
        case 'DEAL_STAGE_CHANGED':
          this.updateStatus({ lastSync: new Date() });
          // Notify all message callbacks
          this.messageCallbacks.forEach(callback => {
            try {
              callback(message.data);
            } catch (error) {
              console.error('Message callback failed:', error);
            }
          });
          break;
          
        case 'CONNECTION_ERROR':
          this.updateStatus({
            isConnected: false,
            errorMessage: message.data?.error || 'Connection error'
          });
          break;
      }
    } catch (error) {
      console.error('❌ Failed to handle remote pipeline message:', error);
    }
  }

  private updateStatus(updates: Partial<RemotePipelineStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallback(this.status);
  }

  private sendMessage(type: string, data: any = null) {
    if (!this.iframe?.contentWindow) {
      console.warn('⚠️ Remote pipeline iframe not ready');
      return false;
    }

    const message: PipelineMessage = {
      type,
      data,
      source: 'CRM',
      timestamp: Date.now()
    };

    try {
      this.iframe.contentWindow.postMessage(message, '*');
      console.log('📤 Message sent to remote pipeline:', type);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message to remote pipeline:', error);
      return false;
    }
  }

  initializePipeline() {
    if (!this.iframe?.contentWindow) {
      console.warn('⚠️ Remote pipeline iframe not ready for initialization');
      return;
    }

    // First, try to inject the bridge code
    this.injectBridgeCode();
    
    // Then send initialization data
    setTimeout(() => {
      this.sendInitializationData();
    }, 1000);
  }

  private injectBridgeCode() {
    const bridgeCode = `
      (function() {
        if (window.crmBridge) {
          console.log('CRM Bridge already exists');
          window.parent.postMessage({
            type: 'BRIDGE_READY',
            source: 'REMOTE_PIPELINE',
            timestamp: Date.now()
          }, '*');
          return;
        }

        console.log('Injecting CRM Bridge code...');
        
        class CRMPipelineBridge {
          constructor() {
            this.deals = [];
            this.stages = [];
            this.isInitialized = false;
            window.addEventListener('message', this.handleMessage.bind(this));
            console.log('CRM Pipeline Bridge initialized');
            
            // Notify parent that bridge is ready
            window.parent.postMessage({
              type: 'BRIDGE_READY',
              source: 'REMOTE_PIPELINE',
              timestamp: Date.now()
            }, '*');
          }

          handleMessage(event) {
            try {
              const message = event.data;
              if (!message || message.source !== 'CRM') return;
              
              console.log('CRM message received:', message.type);
              
              switch (message.type) {
                case 'CRM_INIT':
                  this.handleInit(message.data);
                  break;
                case 'SYNC_DEALS':
                  this.handleDealsSync(message.data.deals);
                  break;
              }
            } catch (error) {
              console.error('Failed to handle CRM message:', error);
            }
          }

          handleInit(data) {
            console.log('CRM initialization received');
            this.deals = data.pipelineData.deals || [];
            this.stages = data.pipelineData.stages || [];
            this.isInitialized = true;
            
            // Update UI if possible
            this.updateUI();
            
            // Confirm initialization
            window.parent.postMessage({
              type: 'CRM_INIT_COMPLETE',
              data: {
                dealsReceived: this.deals.length,
                stagesReceived: this.stages.length
              },
              source: 'REMOTE_PIPELINE',
              timestamp: Date.now()
            }, '*');
          }

          handleDealsSync(deals) {
            console.log('Syncing deals:', deals.length);
            this.deals = deals;
            this.updateUI();
          }

          updateUI() {
            // Try to update the UI with deal data
            if (window.updatePipelineData) {
              window.updatePipelineData(this.deals, this.stages);
            }
            
            // Dispatch custom event for the app to listen
            window.dispatchEvent(new CustomEvent('crmDataUpdated', {
              detail: { deals: this.deals, stages: this.stages }
            }));
            
            console.log('UI updated with', this.deals.length, 'deals');
          }

          sendToCRM(type, data) {
            window.parent.postMessage({
              type,
              data,
              source: 'REMOTE_PIPELINE',
              timestamp: Date.now()
            }, '*');
          }
        }

        window.crmBridge = new CRMPipelineBridge();
        console.log('CRM Bridge injection complete');
      })();
    `;

    // Try direct injection via eval in iframe context
    try {
      if (this.iframe?.contentWindow) {
        // Use setTimeout to inject after the remote app loads
        setTimeout(() => {
          try {
            if (this.iframe?.contentWindow) {
              (this.iframe.contentWindow as any).eval(bridgeCode);
              console.log('Bridge code injected via eval');
            }
          } catch (evalError) {
            console.warn('Direct injection failed, trying postMessage method');
            this.sendMessage('INJECT_BRIDGE', { code: bridgeCode });
          }
        }, 500);
      }
    } catch (error) {
      console.warn('Bridge injection failed:', error);
    }
  }

  private sendInitializationData() {
    // Get deals and contacts from stores (these would be passed in)
    const deals: any[] = []; // This would come from useDealStore
    const contacts: any[] = []; // This would come from useContactStore
    
    const initData = {
      crmInfo: {
        name: 'Smart CRM Dashboard',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      },
      pipelineData: {
        deals: deals as any[],
        stages: [
          { id: 'lead', name: 'Lead', order: 1 },
          { id: 'qualified', name: 'Qualified', order: 2 },
          { id: 'proposal', name: 'Proposal', order: 3 },
          { id: 'negotiation', name: 'Negotiation', order: 4 },
          { id: 'won', name: 'Won', order: 5 },
          { id: 'lost', name: 'Lost', order: 6 }
        ]
      },
      contactsData: contacts as any[]
    };

    this.sendMessage('CRM_INIT', initData);
  }

  retry() {
    if (this.status.connectionAttempts >= this.maxAttempts) {
      this.updateStatus({
        isConnected: false,
        errorMessage: 'Max connection attempts reached'
      });
      return false;
    }

    this.updateStatus({
      isConnected: false,
      errorMessage: undefined,
      connectionAttempts: this.status.connectionAttempts + 1
    });

    // Reload iframe
    if (this.iframe) {
      this.iframe.src = this.iframe.src;
    }

    return true;
  }

  getStatus(): RemotePipelineStatus {
    return { ...this.status };
  }

  onMessage(callback: (data: any) => void) {
    this.messageCallbacks.push(callback);
  }

  syncDeals(deals: CRMDeal[]) {
    this.sendMessage('SYNC_DEALS', { deals });
    this.updateStatus({ 
      lastSync: new Date(),
      dealCount: deals.length 
    });
  }

  disconnect() {
    this.updateStatus({
      isConnected: false,
      lastSync: null,
      dealCount: 0,
      errorMessage: undefined
    });
    if (this.iframe) {
      this.iframe.src = 'about:blank';
    }
  }

  destroy() {
    window.removeEventListener('message', this.messageHandler);
    this.messageCallbacks = [];
  }
}