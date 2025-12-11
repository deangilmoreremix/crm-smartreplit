// Remote Pipeline Loader - Exact same design as contacts (direct iframe, no spinner)
import React from 'react';

interface RemotePipelineLoaderProps {
  showHeader?: boolean;
}

const RemotePipelineLoader: React.FC<RemotePipelineLoaderProps> = ({ 
  showHeader = false 
}) => {
  const REMOTE_URL = 'https://cheery-syrniki-b5b6ca.netlify.app';

  return (
    <div className="h-full w-full">
      <iframe
        src={REMOTE_URL}
        className="w-full h-full border-0"
        title="Remote Pipeline System"
        allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-navigation allow-top-navigation"
      />
    </div>
  );
};

export default RemotePipelineLoader;