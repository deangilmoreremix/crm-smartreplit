import React from 'react';
import { cn } from '../utils/cn';
import { Icon, IconName } from '../Icon';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: IconName;
  title?: string;
}

export const Callout: React.FC<CalloutProps> = ({
  className,
  variant = 'info',
  icon,
  title,
  children,
  ...props
}) => {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  const defaultIcons: Record<string, IconName> = {
    info: 'bell',
    success: 'check',
    warning: 'bell',
    danger: 'close',
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        variants[variant],
        className
      )}
      role="alert"
      {...props}
    >
      <Icon
        name={icon || defaultIcons[variant]}
        size="md"
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

Callout.displayName = 'Callout';