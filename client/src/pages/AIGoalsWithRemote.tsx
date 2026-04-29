import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ExternalLink, Brain } from 'lucide-react';

const AIGoalsWithRemote: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 w-full overflow-hidden z-40">
      {/* Full Screen AI Goals Component - Module Federation (Coming Soon) */}
      <div className="h-full w-full">
        {/* Placeholder message */}
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI Goals & Agency Suite
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 max-w-md">
              The AI Goals module is under development and will be available soon. This module will
              provide AI-powered goal setting, progress tracking, and automated workflows.
            </p>
            <div className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
              Coming Soon
            </div>
          </div>
        </div>

        {/* Module Federation Status Indicator - Floating */}
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <span>Module Federation (Disabled)</span>
          </div>
        </div>

        {/* External Link Button - Disabled (remote not deployed) */}
        <div className="absolute top-4 left-4 z-30">
          <a
            href="https://agency.smartcrm.vip/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-800 transition-colors shadow-lg"
            title="Agency remote is not deployed yet"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">Agency (Not Deployed)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AIGoalsWithRemote;
