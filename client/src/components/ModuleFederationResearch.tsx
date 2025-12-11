import React from 'react';

// TODO: Replace with Module Federation import once vite.config.ts is updated:
// const ResearchApp = React.lazy(() => import('research/ProductResearchApp'));

const ResearchApp: React.FC = () => (
  <iframe
    src="https://clever-syrniki-4df87f.netlify.app"
    className="w-full h-full border-0"
    title="Product Research Module"
    allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
  />
);

const ModuleFederationResearch: React.FC = () => {
  return (
    <div className="h-full w-full">
      <ResearchApp />
    </div>
  );
};

export default ModuleFederationResearch;