import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
  sidebarWidth?: string;
  rightPanelWidth?: string;
  collapsible?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  header,
  rightPanel,
  className,
  sidebarWidth = '280px',
  rightPanelWidth = '320px',
  collapsible = false
}) => {
  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-950', className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          {header}
        </header>
      )}

      <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust based on header height */}
        {/* Left Sidebar */}
        {sidebar && (
          <aside 
            className="flex-shrink-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-r border-gray-200 dark:border-gray-800 overflow-y-auto"
            style={{ width: sidebarWidth }}
          >
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Right Panel */}
        {rightPanel && (
          <aside 
            className="flex-shrink-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
            style={{ width: rightPanelWidth }}
          >
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
};

// Header component
interface DashboardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between h-16 px-6', className)}>
      {children}
    </div>
  );
};

// Header sections
export const HeaderLeft: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center space-x-4">
    {children}
  </div>
);

export const HeaderCenter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 flex items-center justify-center max-w-2xl mx-4">
    {children}
  </div>
);

export const HeaderRight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center space-x-4">
    {children}
  </div>
);

export default DashboardLayout;