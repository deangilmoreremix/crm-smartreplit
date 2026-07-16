// ContactsModule.tsx - Contacts Module Federation Entry
import React from 'react';

interface ContactsModuleProps {
  sharedData?: {
    contacts?: any[];
    user?: any;
  };
  onContactSelect?: (contact: any) => void;
}

const ContactsModule: React.FC<ContactsModuleProps> = ({ sharedData, onContactSelect }) => {
  return (
    <div className="p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Contacts Module</h3>
      <p className="text-sm text-gray-600">
        Total Contacts: {sharedData?.contacts?.length || 0}
      </p>
    </div>
  );
};

export default ContactsModule;
