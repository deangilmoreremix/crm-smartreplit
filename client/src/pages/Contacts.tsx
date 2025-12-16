import React from 'react';

const Contacts: React.FC = () => {
  return (
    <div className="min-h-screen w-full">
      <iframe
        src="https://remote-contacts-app.com"
        className="w-full h-screen border-0"
        title="Contacts Management"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default Contacts;
