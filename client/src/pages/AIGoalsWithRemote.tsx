import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { ExternalLink } from 'lucide-react';
import ModuleFederationAgency from '../components/ModuleFederationAgency';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

const AIGoalsWithRemote: React.FC = () => {
  const { isDark } = useTheme();
  const { config } = useWhitelabel();

  return (
    <div className="fixed inset-0 w-full overflow-hidden z-40">
      {/* Full Screen AI Goals / Agency Component - Module Federation */}
      <div className="h-full w-full">
        <ModuleFederationAgency showHeader />

        {/* Module Federation Status Indicator - Floating */}
        <div className="absolute top-4 right-4 z-30">
          <div
            className={
              'flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg ' +
              (ENABLE_MFE
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400')
            }
          >
            <div
              className={
                'w-2 h-2 rounded-full animate-pulse ' + (ENABLE_MFE ? 'bg-green-500' : 'bg-purple-500')
              }
            />
            <span>{ENABLE_MFE ? 'Module Federation (Live)' : 'Module Federation (Fallback)'}</span>
          </div>
        </div>

        {/* External Link Button - opens the standalone Agency app */}
        <div className="absolute top-4 left-4 z-30">
          <a
            href="https://agency.smartcrm.vip/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors shadow-lg"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">{config.companyName} Agency</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AIGoalsWithRemote;
