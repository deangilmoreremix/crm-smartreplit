// ContactsApp.tsx - Module Federation Wrapper for your Bolt Contacts App
// Copy this file to your Bolt app at: /src/ContactsApp.tsx

import React, { useEffect, useState } from 'react';

export interface ContactsAppProps {
  onContactSelect?: (contact: any) => void;
  onContactCreate?: (contact: any) => void;
  onContactUpdate?: (contact: any) => void;
  onContactDelete?: (contactId: string) => void;
  initialContacts?: any[];
  theme?: 'light' | 'dark';
}

// Import your existing Bolt contacts component here
// Replace 'YourContactsComponent' with your actual component name
// import YourContactsComponent from './YourContactsComponent';
// import ContactModal from './ContactModal'; // if you have a modal

const ContactsApp: React.FC<ContactsAppProps> = ({
  onContactSelect,
  onContactCreate,
  onContactUpdate,
  onContactDelete,
  initialContacts,
  theme = 'light'
}) => {
  const [contacts, setContacts] = useState(initialContacts || []);

  // Sync initial contacts when they change
  useEffect(() => {
    if (initialContacts) {
      setContacts(initialContacts);
    }
  }, [initialContacts]);

  // Handle contact selection
  const handleContactSelect = (contact: any) => {
    console.log('Contact selected:', contact);
    onContactSelect?.(contact);
  };

  // Handle contact creation
  const handleContactCreate = (newContact: any) => {
    console.log('Contact created:', newContact);
    setContacts(prev => [...prev, newContact]);
    onContactCreate?.(newContact);
  };

  // Handle contact updates
  const handleContactUpdate = (updatedContact: any) => {
    console.log('Contact updated:', updatedContact);
    setContacts(prev => 
      prev.map(contact => 
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
    onContactUpdate?.(updatedContact);
  };

  // Handle contact deletion
  const handleContactDelete = (contactId: string) => {
    console.log('Contact deleted:', contactId);
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    onContactDelete?.(contactId);
  };

  return (
    <div className={`contacts-remote-wrapper ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Apply theme styles */}
      <style>{`
        .contacts-remote-wrapper {
          width: 100%;
          height: 100%;
          min-height: 500px;
        }
        .contacts-remote-wrapper.dark {
          background-color: #1f2937;
          color: white;
        }
      `}</style>
      
      {/* Replace this section with your actual Bolt contacts component */}
      {/* Example integration: */}
      {/*
      <YourContactsComponent
        contacts={contacts}
        onContactSelect={handleContactSelect}
        onContactCreate={handleContactCreate}
        onContactUpdate={handleContactUpdate}
        onContactDelete={handleContactDelete}
        theme={theme}
      />
      */}
      
      {/* Temporary placeholder - REPLACE THIS with your actual component */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Remote Contacts App from Bolt
        </h2>
        <p className="text-gray-600 mb-4">
          Replace this section with your actual contacts component from Bolt.
        </p>
        
        {/* Example of how to display contacts */}
        <div className="grid gap-4">
          {contacts.map((contact, index) => (
            <div 
              key={contact.id || index}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleContactSelect(contact)}
            >
              <h3 className="font-semibold">{contact.name || `Contact ${index + 1}`}</h3>
              <p className="text-sm text-gray-600">{contact.email || 'No email'}</p>
              <p className="text-sm text-gray-600">{contact.company || 'No company'}</p>
            </div>
          ))}
        </div>
        
        {/* Example create button */}
        <button
          onClick={() => handleContactCreate({
            id: Date.now().toString(),
            name: 'New Contact',
            email: 'new@example.com',
            company: 'New Company'
          })}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Test Contact
        </button>
      </div>
    </div>
  );
};

export default ContactsApp;

// Optional: Export ContactModal if you have one
// export { default as ContactModal } from './ContactModal';