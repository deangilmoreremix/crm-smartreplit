// Remote Contacts Bridge Service
// Handles communication between remote contacts module and local CRM

import { remoteAssistantBridge } from './remoteAssistantBridge';

export interface RemoteContactMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class RemoteContactsBridge {
  private iframe: HTMLIFrameElement | null = null;
  private origin: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected = false;

  constructor(origin: string = 'https://taupe-sprinkles-83c9ee.netlify.app') {
    this.origin = origin;
    this.setupMessageListener();
  }

  setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.origin) {
        return;
      }

      const message: RemoteContactMessage = event.data;
      console.log('🔗 Bridge received message:', message);

      if (message.type === 'REMOTE_READY') {
        this.isConnected = true;
        console.log('✅ Remote contacts module is ready');
      }

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    });
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  sendMessage(type: string, data: any) {
    if (!this.iframe) {
      console.warn('⚠️ Bridge: No iframe reference available');
      return;
    }

    const message: RemoteContactMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    console.log('📤 Bridge sending message:', message);
    this.iframe.contentWindow?.postMessage(message, this.origin);
  }

  // Initialize CRM connection
  initializeCRM(contacts: CRMContact[], crmInfo: any) {
    this.sendMessage('CRM_INIT', {
      contacts,
      crmInfo,
      capabilities: {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canSync: true
      }
    });
  }

  // Send contacts data to remote module
  syncContacts(contacts: CRMContact[]) {
    this.sendMessage('CONTACTS_SYNC', { contacts });
  }

  // Request contacts from remote module
  requestContactsData() {
    this.sendMessage('REQUEST_CONTACTS', {});
  }

  // Notify remote of local contact changes
  notifyContactCreated(contact: CRMContact) {
    this.sendMessage('LOCAL_CONTACT_CREATED', contact);
  }

  notifyContactUpdated(contact: CRMContact) {
    this.sendMessage('LOCAL_CONTACT_UPDATED', contact);
  }

  notifyContactDeleted(contactId: string) {
    this.sendMessage('LOCAL_CONTACT_DELETED', { id: contactId });
  }

  // Navigation helpers that can be called from CRM
  sendNavigationCapabilities() {
    this.sendMessage('NAVIGATION_AVAILABLE', {
      routes: [
        { path: '/', name: 'Dashboard' },
        { path: '/contacts', name: 'Contacts' },
        { path: '/deals', name: 'Deals' },
        { path: '/tasks', name: 'Tasks' },
        { path: '/calendar', name: 'Calendar' }
      ]
    });
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // AI Assistant Integration
  initializeAssistantForContact(contactId: string) {
    remoteAssistantBridge.registerIframe(this.iframe!);
    this.sendMessage('ASSISTANT_AVAILABLE', {
      contactId,
      assistantType: 'contact',
      capabilities: {
        canChat: true,
        canAnalyze: true,
        canSuggest: true,
        canSocialResearch: true
      }
    });
  }

  sendAssistantResponse(contactId: string, response: any) {
    this.sendMessage('ASSISTANT_RESPONSE', {
      contactId,
      response
    });
  }

  requestContactAssistant(contactId: string, action: string, data: any) {
    this.sendMessage('ASSISTANT_REQUEST', {
      contactId,
      action,
      data
    });
  }

  disconnect() {
    if (this.iframe) {
      remoteAssistantBridge.unregisterIframe(this.iframe);
    }
    this.isConnected = false;
    this.messageHandlers.clear();
  }
}