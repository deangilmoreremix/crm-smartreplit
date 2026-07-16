// ContactsApp.tsx - Module Federation Entry for Contacts
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { eventBus } from './eventBus';

interface Contact {
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

interface ContactsAppProps {
  sharedData?: {
    user?: any;
    isAuthenticated?: boolean;
    contacts?: Contact[];
  };
  onContactSelect?: (contact: Contact) => void;
  onContactCreate?: (contact: Contact) => void;
  onContactUpdate?: (contact: Contact) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: Contact[];
}

const ContactsApp: React.FC<ContactsAppProps> = ({
  sharedData,
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  initialContacts = [],
}) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [authState, setAuthState] = useState({
    user: sharedData?.user ?? null,
    isAuthenticated: sharedData?.isAuthenticated ?? false
  });

  // Use ref to always have current contacts in the onRequest handler
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;

  // Listen for auth state changes from host via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_STATE_CHANGED') {
        setAuthState({
          user: event.data.payload?.user ?? null,
          isAuthenticated: event.data.payload?.isAuthenticated ?? false
        });
      }
      if (event.data?.type === 'CRM_CONTACTS_SYNC') {
        setContacts(event.data.contacts || []);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Register request handler using ref to avoid stale closure
  useEffect(() => {
    const unsubscribe = eventBus.onRequest('contacts', async (action, data) => {
      const currentContacts = contactsRef.current;
      switch (action) {
        case 'getContact':
          return currentContacts.find(c => c.id === data?.id) || null;
        case 'listContacts':
          return currentContacts;
        case 'createContact': {
          const newContact = { ...data, id: Date.now().toString() };
          setContacts(prev => [...prev, newContact]);
          return newContact;
        }
        case 'updateContact': {
          setContacts(prev => prev.map(c => c.id === data?.id ? { ...c, ...data } : c));
          return currentContacts.find(c => c.id === data?.id) || null;
        }
        case 'deleteContact':
          setContacts(prev => prev.filter(c => c.id !== data?.id));
          return { success: true };
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    });
    return unsubscribe;
  }, []);

  // Notify parent that module is ready
  useEffect(() => {
    window.parent.postMessage(
      { type: 'CONTACTS_MODULE_READY', source: 'REMOTE_CONTACTS' },
      '*'
    );
  }, []);

  const handleContactAction = useCallback((action: string, contact: Contact) => {
    window.parent.postMessage(
      { type: `CONTACT_${action.toUpperCase()}`, data: contact, source: 'REMOTE_CONTACTS' },
      '*'
    );
    switch (action) {
      case 'select': onContactSelect?.(contact); break;
      case 'create': onContactCreate?.(contact); break;
      case 'update': onContactUpdate?.(contact); break;
      case 'delete': onContactDelete?.(contact.id); break;
    }
  }, [onContactSelect, onContactCreate, onContactUpdate, onContactDelete]);

  if (!authState.isAuthenticated) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in via the main CRM to access Contacts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contacts Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleContactAction('select', contact)}
            >
              <h3 className="font-semibold text-lg">{contact.name}</h3>
              <p className="text-gray-600">{contact.email}</p>
              {contact.company && <p className="text-sm text-gray-500">{contact.company}</p>}
              {contact.phone && <p className="text-sm text-blue-600">{contact.phone}</p>}

              <div className="mt-3 flex space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleContactAction('update', contact); }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleContactAction('delete', contact); }}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No contacts available</p>
            <button
              onClick={() => handleContactAction('create', {
                id: Date.now().toString(),
                name: 'New Contact',
                email: 'new@example.com',
              })}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add First Contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsApp;
