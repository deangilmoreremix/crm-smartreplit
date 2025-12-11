// Remote Contacts Page - Embedded Module with CRM Integration
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Link, Wifi, WifiOff } from 'lucide-react';
import { useContactStore } from '../hooks/useContactStore';
import { RemoteContactsBridge, CRMContact } from '../services/remoteContactsBridge';
import { remoteAppManager } from '../utils/remoteAppManager';
import { universalDataSync } from '../services/universalDataSync';

const ContactsWithRemote: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<RemoteContactsBridge | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { contacts, addContact, updateContact, deleteContact, fetchContacts } = useContactStore();

  // Convert Contact to CRMContact format
  const convertToCRMContact = (contact: any): CRMContact => ({
    id: contact.id,
    name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    position: contact.position || contact.title,
    tags: contact.tags || [],
    notes: contact.notes,
    createdAt: typeof contact.createdAt === 'string' ? contact.createdAt : contact.createdAt?.toISOString(),
    updatedAt: typeof contact.updatedAt === 'string' ? contact.updatedAt : contact.updatedAt?.toISOString()
  });

  // Initialize bridge and set up communication
  useEffect(() => {
    const bridge = new RemoteContactsBridge();
    bridgeRef.current = bridge;

    // Register with universal manager
    remoteAppManager.registerBridge('contacts', bridge);

    // Initialize universal sync
    universalDataSync.initialize();

    // Set up message handlers
    bridge.onMessage('REMOTE_READY', () => {
      setIsConnected(true);
      console.log('✅ Remote contacts module connected');
    });

    bridge.onMessage('CONTACT_CREATED', (contact) => {
      console.log('📝 Remote contact created:', contact);
      addContact(contact);
    });

    bridge.onMessage('CONTACT_UPDATED', (contact) => {
      console.log('✏️ Remote contact updated:', contact);
      updateContact(contact.id, contact);
    });

    bridge.onMessage('CONTACT_DELETED', (data) => {
      console.log('🗑️ Remote contact deleted:', data.id);
      deleteContact(data.id);
    });

    bridge.onMessage('REQUEST_CONTACTS', () => {
      console.log('📤 Remote requesting contacts data');
      const crmContacts = Object.values(contacts).map(convertToCRMContact);
      bridge.syncContacts(crmContacts);
    });

    bridge.onMessage('SYNC_REQUEST', () => {
      console.log('🔄 Remote requesting full sync');
      fetchContacts();
    });

    bridge.onMessage('NAVIGATE', (data) => {
      console.log('🧭 Remote requesting navigation to:', data.route);
      if (data.route && typeof data.route === 'string') {
        // Use window.location for navigation
        if (data.route.startsWith('/')) {
          window.location.pathname = data.route;
        } else {
          window.location.hash = '#/' + data.route;
        }
      }
    });

    bridge.onMessage('NAVIGATE_BACK', () => {
      console.log('⬅️ Remote requesting navigation back');
      window.history.back();
    });

    bridge.onMessage('NAVIGATE_TO_DASHBOARD', () => {
      console.log('🏠 Remote requesting navigation to dashboard');
      window.location.pathname = '/';
    });

    return () => {
      bridge.disconnect();
    };
  }, [addContact, updateContact, deleteContact, fetchContacts]);

  // Handle iframe load and initialize CRM connection
  const handleIframeLoad = () => {
    if (iframeRef.current && bridgeRef.current) {
      bridgeRef.current.setIframe(iframeRef.current);
      
      // Try to inject bridge code into remote module
      setTimeout(() => {
        injectBridgeCode();
      }, 1000);
      
      // Wait for remote app to initialize, then send CRM data
      setTimeout(() => {
        const crmContacts = Object.values(contacts).map(convertToCRMContact);
        bridgeRef.current?.initializeCRM(crmContacts, {
          name: 'CRM System',
          version: '1.0.0',
          features: ['contacts', 'deals', 'tasks', 'ai-tools', 'navigation']
        });
        
        // Send navigation capabilities
        bridgeRef.current?.sendNavigationCapabilities();
      }, 2000);
    }
  };

  // Inject bridge code into the remote iframe
  const injectBridgeCode = () => {
    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDoc) {
        console.warn('⚠️ Cannot access iframe document - cross-origin restrictions');
        return;
      }

      // Create script element with bridge code
      const script = iframeDoc.createElement('script');
      script.textContent = `
        console.log('🚀 Injecting CRM Bridge into remote module');
        
        // CRM Integration Bridge for Remote Contacts Module
        class CRMBridge {
          constructor() {
            this.parentOrigin = '${window.location.origin}';
            this.isConnected = false;
            this.setupMessageListener();
            this.notifyReady();
          }

          setupMessageListener() {
            window.addEventListener('message', (event) => {
              if (event.origin !== this.parentOrigin) {
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
            console.log('🚀 CRM initialized with', data.contacts?.length || 0, 'contacts');
            this.isConnected = true;
            
            // Try to integrate with existing contact management
            if (data.contacts && window.loadContactsFromCRM) {
              window.loadContactsFromCRM(data.contacts);
            } else {
              console.log('💾 CRM contacts available:', data.contacts);
            }
          }

          handleContactsSync(contacts) {
            console.log('🔄 Syncing', contacts.length, 'contacts from CRM');
            if (window.loadContactsFromCRM) {
              window.loadContactsFromCRM(contacts);
            }
          }

          handleLocalContactCreated(contact) {
            console.log('➕ Local contact created:', contact);
            if (window.addContactFromCRM) {
              window.addContactFromCRM(contact);
            }
          }

          handleLocalContactUpdated(contact) {
            console.log('✏️ Local contact updated:', contact);
            if (window.updateContactFromCRM) {
              window.updateContactFromCRM(contact);
            }
          }

          handleLocalContactDeleted(data) {
            console.log('🗑️ Local contact deleted:', data.id);
            if (window.deleteContactFromCRM) {
              window.deleteContactFromCRM(data.id);
            }
          }

          // Methods that the remote module can call
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

          // Navigation methods for remote module to use
          navigateTo(route) {
            this.sendToCRM('NAVIGATE', { route });
          }

          navigateBack() {
            this.sendToCRM('NAVIGATE_BACK', {});
          }

          navigateToDashboard() {
            this.sendToCRM('NAVIGATE_TO_DASHBOARD', {});
          }

          sendToCRM(type, data) {
            if (window.parent) {
              window.parent.postMessage({ type, data }, this.parentOrigin);
              console.log('📤 Sent to CRM:', type, data);
            }
          }
        }

        // Initialize the bridge and make it globally available
        window.crmBridge = new CRMBridge();
        
        // Helper functions for the remote module to use
        window.notifyContactCreated = (contact) => window.crmBridge?.notifyContactCreated(contact);
        window.notifyContactUpdated = (contact) => window.crmBridge?.notifyContactUpdated(contact);
        window.notifyContactDeleted = (contactId) => window.crmBridge?.notifyContactDeleted(contactId);
        
        // Navigation helper functions
        window.navigateTo = (route) => window.crmBridge?.navigateTo(route);
        window.navigateBack = () => window.crmBridge?.navigateBack();
        window.navigateToDashboard = () => window.crmBridge?.navigateToDashboard();
        
        console.log('✅ CRM Bridge injected successfully');
      `;

      // Append script to iframe document
      iframeDoc.head.appendChild(script);
      console.log('💉 Bridge code injected into remote module');

    } catch (error) {
      console.warn('⚠️ Failed to inject bridge code:', (error as Error).message);
      console.log('📝 This is expected with cross-origin iframes. Attempting postMessage approach...');
      
      // Try postMessage approach as fallback
      setTimeout(() => {
        attemptPostMessageBridge();
      }, 500);
    }
  };

  // Attempt to setup bridge via postMessage
  const attemptPostMessageBridge = () => {
    if (!iframeRef.current?.contentWindow) return;
    
    console.log('📡 Attempting bridge setup via postMessage');
    
    // Send multiple setup attempts with different approaches
    const messages = [
      { type: 'CRM_BRIDGE_SETUP', origin: window.location.origin },
      { type: 'PARENT_READY', data: { crmOrigin: window.location.origin } },
      { type: 'INIT_COMMUNICATION', data: { ready: true } }
    ];
    
    messages.forEach((message, index) => {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(message, 'https://taupe-sprinkles-83c9ee.netlify.app');
        console.log(`📤 Sent setup message ${index + 1}:`, message.type);
      }, index * 200);
    });
  };

  // Notify remote when local contacts change
  useEffect(() => {
    if (bridgeRef.current && isConnected) {
      const crmContacts = Object.values(contacts).map(convertToCRMContact);
      bridgeRef.current.syncContacts(crmContacts);
    }
  }, [contacts, isConnected]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-blue-600" />
              Contacts Module
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remote contact management system
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
              ✓ Remote Module
            </div>
            <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
            }`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'CRM Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Remote App */}
      <div className="flex-1" style={{ height: 'calc(100vh - 100px)' }}>
        <iframe
          ref={iframeRef}
          src="https://taupe-sprinkles-83c9ee.netlify.app"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            overflow: 'hidden'
          }}
          title="Remote Contacts Module"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
};

export default ContactsWithRemote;