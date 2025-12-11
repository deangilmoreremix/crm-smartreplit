import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CommunicationDashboardProps {
  appName: string;
  appDescription: string;
  children: React.ReactNode;
  actionButtons?: React.ReactNode[];
  headerStats?: React.ReactNode;
}

export const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({
  appName,
  appDescription,
  children,
  actionButtons = [],
  headerStats
}) => {
  const { isDark } = useTheme();

  return (
    <>
      {/* Standardized Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start py-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {appName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                {appDescription}
              </p>
              {headerStats && (
                <div className="mt-4">
                  {headerStats}
                </div>
              )}
            </div>
            {actionButtons.length > 0 && (
              <div className="flex gap-3 ml-6">
                {actionButtons}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Standardized Container */}
      <main className={`w-full h-full overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </>
  );
};

export default CommunicationDashboard;