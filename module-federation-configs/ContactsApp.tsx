// Exposed Contacts Component for Module Federation
// File: src/ContactsApp.tsx (for contacts app)

import React, { useEffect, useState } from 'react';

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
  onContactSelect?: (contact: Contact) => void;
  onContactCreate?: (contact: Contact) => void;
  onContactUpdate?: (contact: Contact) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: Contact[];
}

const ContactsApp: React.FC<ContactsAppProps> = ({
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  initialContacts = []
}) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  // Listen for messages from parent CRM
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CRM_CONTACTS_SYNC') {
        setContacts(event.data.contacts || []);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that contacts module is ready
    window.parent.postMessage({
      type: 'CONTACTS_MODULE_READY',
      source: 'REMOTE_CONTACTS'
    }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleContactAction = (action: string, contact: Contact) => {
    // Notify parent CRM of contact actions
    window.parent.postMessage({
      type: `CONTACT_${action.toUpperCase()}`,
      data: contact,
      source: 'REMOTE_CONTACTS'
    }, '*');

    // Execute local callbacks
    switch (action) {
      case 'select':
        onContactSelect?.(contact);
        break;
      case 'create':
        onContactCreate?.(contact);
        break;
      case 'update':
        onContactUpdate?.(contact);
        break;
      case 'delete':
        onContactDelete?.(contact.id);
        break;
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contacts Management</h1>
        
        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleContactAction('select', contact)}
            >
              <h3 className="font-semibold text-lg">{contact.name}</h3>
              <p className="text-gray-600">{contact.email}</p>
              {contact.company && (
                <p className="text-sm text-gray-500">{contact.company}</p>
              )}
              {contact.phone && (
                <p className="text-sm text-blue-600">{contact.phone}</p>
              )}
              
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactAction('update', contact);
                  }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactAction('delete', contact);
                  }}
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
                email: 'new@example.com'
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