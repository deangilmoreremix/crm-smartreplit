import React from 'react';
import { cn } from '../../lib/utils';
import { Settings, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';

interface WidgetContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  showSettings?: boolean;
  showDragHandle?: boolean;
  onSettingsClick?: () => void;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  description,
  children,
  actions,
  className,
  showSettings = true,
  showDragHandle = false,
  onSettingsClick,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          {showDragHandle && (
            <button className="cursor-grab text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {actions}
          {showSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
              onClick={onSettingsClick}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
};

interface WidgetFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const WidgetFooter: React.FC<WidgetFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-sm',
        className
      )}
    >
      {children}
    </div>
  );
};

export default WidgetContainer;
