import React, { useEffect, useRef, useState } from 'react';
import { RemoteContactsBridge, CRMContact } from '../../services/remoteContactsBridge';
import { useContactStore } from '../../hooks/useContactStore';
import { remoteAssistantBridge } from '../../services/remoteAssistantBridge';
import { Bot, MessageSquare, Brain, Sparkles } from 'lucide-react';

interface RemoteContactsWithAssistantProps {
  onContactSelect?: (contact: CRMContact) => void;
  onContactUpdate?: (contact: CRMContact) => void;
}

const RemoteContactsWithAssistant: React.FC<RemoteContactsWithAssistantProps> = ({
  onContactSelect,
  onContactUpdate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<RemoteContactsBridge | null>(null);
  const { contacts } = useContactStore();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [assistantChat, setAssistantChat] = useState<any[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    if (iframeRef.current && !bridgeRef.current) {
      // Initialize the bridge
      bridgeRef.current = new RemoteContactsBridge();
      bridgeRef.current.setIframe(iframeRef.current);

      // Register with assistant bridge
      remoteAssistantBridge.registerIframe(iframeRef.current);

      // Setup message handlers
      bridgeRef.current.onMessage('REMOTE_CONTACT_SELECTED', (data) => {
        console.log('📋 Remote contact selected:', data);
        setSelectedContactId(data.contactId);
        
        // Initialize assistant for this contact
        if (data.contactId) {
          bridgeRef.current?.initializeAssistantForContact(data.contactId);
        }
        
        if (onContactSelect) {
          onContactSelect(data.contact);
        }
      });

      bridgeRef.current.onMessage('REMOTE_CONTACT_UPDATED', (data) => {
        console.log('📋 Remote contact updated:', data);
        if (onContactUpdate) {
          onContactUpdate(data.contact);
        }
      });

      bridgeRef.current.onMessage('ASSISTANT_REQUEST', async (data) => {
        console.log('🤖 Assistant request from remote:', data);
        await handleAssistantRequest(data);
      });

      // Send initial data
      const crmContacts = Object.values(contacts).map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position || contact.title,
        tags: contact.tags || [],
        notes: contact.notes || '',
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }));

      bridgeRef.current.initializeCRM(crmContacts, {
        appName: 'SmartCRM',
        version: '1.0.0',
        features: ['ai-assistant', 'social-research', 'analytics']
      });
    }

    return () => {
      if (iframeRef.current) {
        remoteAssistantBridge.unregisterIframe(iframeRef.current);
      }
      if (bridgeRef.current) {
        bridgeRef.current.disconnect();
      }
    };
  }, []);

  const handleAssistantRequest = async (data: any) => {
    const { contactId, action, data: requestData } = data;
    setIsAssistantLoading(true);

    try {
      let response;
      
      switch (action) {
        case 'start_chat':
          response = await startAssistantChat(contactId, requestData.message);
          break;
        case 'send_message':
          response = await sendAssistantMessage(contactId, requestData.message);
          break;
        case 'get_suggestions':
          response = await getAssistantSuggestions(contactId, requestData.context);
          break;
        case 'quick_analysis':
          response = await performQuickAnalysis(contactId, requestData);
          break;
        default:
          response = { error: 'Unknown action' };
      }

      // Send response back to remote app
      bridgeRef.current?.sendAssistantResponse(contactId, response);
      
    } catch (error) {
      console.error('Assistant request failed:', error);
      bridgeRef.current?.sendAssistantResponse(contactId, {
        error: error instanceof Error ? error.message : 'Assistant request failed'
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const startAssistantChat = async (contactId: string, message: string) => {
    const contact = contacts[contactId];
    if (!contact) return { error: 'Contact not found' };

    // Start conversation with assistant
    const chatMessage = {
      type: 'ASSISTANT_START_CONVERSATION',
      assistantType: 'contact',
      entityId: contactId,
      data: {
        initialMessage: message,
        contactContext: {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          position: contact.position || contact.title,
          notes: contact.notes
        }
      }
    };

    return new Promise((resolve) => {
      const handleResponse = (event: MessageEvent) => {
        if (event.data.type === 'ASSISTANT_START_CONVERSATION_RESPONSE') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      window.postMessage(chatMessage, '*');
    });
  };

  const sendAssistantMessage = async (contactId: string, message: string) => {
    const chatMessage = {
      type: 'ASSISTANT_SEND_MESSAGE',
      assistantType: 'contact',
      entityId: contactId,
      data: { message }
    };

    return new Promise((resolve) => {
      const handleResponse = (event: MessageEvent) => {
        if (event.data.type === 'ASSISTANT_SEND_MESSAGE_RESPONSE') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      window.postMessage(chatMessage, '*');
    });
  };

  const getAssistantSuggestions = async (contactId: string, context: any) => {
    const contact = contacts[contactId];
    
    const suggestionMessage = {
      type: 'ASSISTANT_GET_SUGGESTIONS',
      assistantType: 'contact',
      entityId: contactId,
      data: {
        context: {
          ...context,
          contact: contact
        }
      }
    };

    return new Promise((resolve) => {
      const handleResponse = (event: MessageEvent) => {
        if (event.data.type === 'ASSISTANT_GET_SUGGESTIONS_RESPONSE') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      window.postMessage(suggestionMessage, '*');
    });
  };

  const performQuickAnalysis = async (contactId: string, data: any) => {
    const contact = contacts[contactId];
    
    const analysisMessage = {
      type: 'ASSISTANT_QUICK_ANALYSIS',
      assistantType: 'contact',
      entityId: contactId,
      data: {
        contact,
        analysisType: data.type || 'general',
        context: data.context
      }
    };

    return new Promise((resolve) => {
      const handleResponse = (event: MessageEvent) => {
        if (event.data.type === 'ASSISTANT_QUICK_ANALYSIS_RESPONSE') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      window.postMessage(analysisMessage, '*');
    });
  };

  return (
    <div className="w-full h-full relative">
      <iframe
        ref={iframeRef}
        src="https://taupe-sprinkles-83c9ee.netlify.app"
        className="w-full h-full border-0"
        title="Remote Contacts with AI Assistant"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {/* AI Assistant Indicator */}
      {selectedContactId && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${isAssistantLoading ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {isAssistantLoading ? (
                  <Brain className="h-4 w-4 text-yellow-600 animate-pulse" />
                ) : (
                  <Bot className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">AI Assistant</div>
                <div className="text-gray-500">
                  {isAssistantLoading ? 'Processing...' : 'Ready'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Status Toast */}
      {showAssistant && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">
                  Assistant Active
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  AI assistant is helping with contact management
                </div>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteContactsWithAssistant;