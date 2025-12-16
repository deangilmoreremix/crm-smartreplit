import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  className?: string;
}

export default function PageLayout({
  title,
  description,
  children,
  actions,
  variant = 'glass',
  className = ''
}: PageLayoutProps) {
  const { isDark, toggleTheme } = useTheme();

  const getContainerClasses = () => {
    const baseClasses = 'w-full h-full overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8';

    switch (variant) {
      case 'glass':
        return `${baseClasses} bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xl`;
      case 'elevated':
        return `${baseClasses} bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl`;
      default:
        return `${baseClasses} bg-gray-50 dark:bg-gray-900`;
    }
  };

  console.log('🎨 PageLayout rendering:', { title, isDark, hasActions: !!actions });

  return (
    <main className={`${getContainerClasses()} ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 drop-shadow-sm">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 drop-shadow-sm">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🌙 Theme toggle clicked, current isDark:', isDark);
                  toggleTheme();
                }}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                data-testid="button-page-theme-toggle"
              >
                {isDark ? (
                  <>
                    <Sun size={16} className="text-yellow-500" />
                    <span className="hidden sm:inline">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} className="text-blue-500" />
                    <span className="hidden sm:inline">Dark Mode</span>
                  </>
                )}
              </Button>
              {actions && <div>{actions}</div>}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </main>
  );
}