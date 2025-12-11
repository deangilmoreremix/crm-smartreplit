import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ExternalLink, Brain } from 'lucide-react';
import ModuleFederationAIGoals from '../components/ModuleFederationAIGoals';

const AIGoalsWithRemote: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="w-full overflow-hidden relative" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Full Screen AI Goals Component - Positioned below navbar */}
      <div className="h-full w-full">
        <ModuleFederationAIGoals showHeader={false} />
        
        {/* Module Federation Status Indicator - Floating */}
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span>Module Federation</span>
          </div>
        </div>
        
        {/* External Link Button - Floating */}
        <div className="absolute top-4 left-4 z-30">
          <a
            href="https://tubular-choux-2a9b3c.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors shadow-lg"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">Open in New Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AIGoalsWithRemote;