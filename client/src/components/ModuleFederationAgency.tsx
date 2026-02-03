import React from 'react';

// TODO: Replace with Module Federation import once vite.config.ts is updated:
// const AgencyApp = React.lazy(() => import('agency/AIAgencyApp'));

const AgencyApp: React.FC = () => (
  <iframe
    src="https://agency.smartcrm.vip/"
    className="w-full h-full border-0"
    title="AI Agency Suite"
    allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
  />
);

const ModuleFederationAgency: React.FC = () => {
  return (
    <div className="h-full w-full">
      <AgencyApp />
    </div>
  );
};

export default ModuleFederationAgency;