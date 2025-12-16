import React from 'react';

const Pipeline: React.FC = () => {
  return (
    <div className="min-h-screen w-full">
      <iframe
        src="https://cheery-syrniki-b5b6ca.netlify.app"
        className="w-full h-screen border-0"
        title="Pipeline Management"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default Pipeline;
