import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

export const AIToolLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div className="w-48 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="w-32 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>

      {/* Form skeleton */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="w-40 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="w-28 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-full h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="w-36 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-48 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-40 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>

      {/* Results skeleton */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
        <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
