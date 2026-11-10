import React from 'react';
import { cn } from '../utils/cn';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: BannerVariant;
  title?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const variants: Record<BannerVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
};

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  action,
  onDismiss,
  className,
  children,
  ...props
}) => (
  <div
    role={variant === 'danger' ? 'alert' : 'status'}
    className={cn('flex items-center gap-3 rounded-md border px-4 py-3 text-sm', variants[variant], className)}
    {...props}
  >
    <div className="flex-1">
      {title && <div className="font-medium">{title}</div>}
      {children && <div>{children}</div>}
    </div>
    {action}
    {onDismiss && (
      <button type="button" aria-label="Dismiss" onClick={onDismiss} className="text-current opacity-70 hover:opacity-100">
        ×
      </button>
    )}
  </div>
);
