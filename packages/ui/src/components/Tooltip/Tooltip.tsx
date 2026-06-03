import React, { useState } from 'react';
import { cn } from '../utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
}) => {
  const [visible, setVisible] = useState(false);
  let timeoutRef: NodeJS.Timeout;

  const show = () => {
    timeoutRef = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef);
    setVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  };

  return (
    <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none',
            'before:content[""] before:absolute before:w-0 before:h-0',
            position === 'top' && 'before:border-4 before:border-transparent before:border-t-gray-900 dark:before:border-t-gray-700 before:top-full before:left-1/2 before:-translate-x-1/2',
            position === 'bottom' && 'before:border-4 before:border-transparent before:border-b-gray-900 dark:before:border-b-gray-700 before:bottom-full before:left-1/2 before:-translate-x-1/2',
            position === 'left' && 'before:border-4 before:border-transparent before:border-l-gray-900 dark:before:border-l-gray-700 before:left-full before:top-1/2 before:-translate-y-1/2',
            position === 'right' && 'before:border-4 before:border-transparent before:border-r-gray-900 dark:before:border-r-gray-700 before:right-full before:top-1/2 before:-translate-y-1/2',
            positions[position]
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';