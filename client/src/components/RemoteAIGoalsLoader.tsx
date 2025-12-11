// Simple Remote AI Goals Loader for Dashboard Sections
import React from 'react';

interface RemoteAIGoalsLoaderProps {
  showHeader?: boolean;
}

const RemoteAIGoalsLoader: React.FC<RemoteAIGoalsLoaderProps> = ({ showHeader = true }) => {
  return (
    <div className="w-full h-full">
      {showHeader && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Remote AI Goals
          </h3>
        </div>
      )}
      
      <iframe
        src="https://tubular-choux-2a9b3c.netlify.app"
        style={{
          width: '100%',
          height: showHeader ? 'calc(100% - 50px)' : '100%',
          border: 'none'
        }}
        title="Remote AI Goals"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      />
    </div>
  );
};

export default RemoteAIGoalsLoader;