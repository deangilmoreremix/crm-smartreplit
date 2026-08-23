import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles = {
  info: {
    container: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    description: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    description: 'text-amber-800 dark:text-amber-200',
  },
  error: {
    container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    description: 'text-red-800 dark:text-red-200',
  },
};

const defaultIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = 'info', title, icon, children, ...props }, ref) => {
    const styles = variantStyles[variant];
    const DefaultIcon = defaultIcons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex gap-3 rounded-lg border p-4',
          styles.container,
          className
        )}
        {...props}
      >
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {icon || <DefaultIcon className="h-5 w-5" />}
        </div>
        <div className="flex-1 space-y-1">
          {title && (
            <h5 className={cn('font-semibold text-sm leading-none', styles.title)}>
              {title}
            </h5>
          )}
          {children && (
            <div className={cn('text-sm', !title && 'mt-0', styles.description)}>
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Callout.displayName = 'Callout';

export { Callout };
