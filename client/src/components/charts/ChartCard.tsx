import React from 'react';
import { cn } from '../../lib/utils';

export interface ChartCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  className,
  contentClassName,
  children,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl backdrop-blur-xl p-6',
        'bg-white dark:bg-white/5',
        'border border-gray-200 dark:border-white/10',
        'shadow-sm',
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default ChartCard;
