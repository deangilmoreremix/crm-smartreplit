import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ModuleFederationContacts from '../components/ModuleFederationContacts';

const ContactsWorking: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="absolute inset-0 w-full overflow-hidden" style={{ top: '80px', height: 'calc(100vh - 80px)' }}>
      {/* Full Screen Contacts Component */}
      <div className="h-full w-full">
        <ModuleFederationContacts showHeader={false} />
      </div>
    </div>
  );
};

export default ContactsWorking;