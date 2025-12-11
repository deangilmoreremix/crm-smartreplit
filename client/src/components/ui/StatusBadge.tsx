import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  danger: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  neutral: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm'
};

const pulseStyles = {
  default: 'animate-pulse',
  success: 'animate-pulse',
  warning: 'animate-pulse',
  danger: 'animate-pulse',
  info: 'animate-pulse',
  neutral: 'animate-pulse'
};

// Helper function to determine variant based on status
const getVariantFromStatus = (status: string): keyof typeof variantStyles => {
  const statusLower = status.toLowerCase();
  
  if (['active', 'completed', 'success', 'online', 'approved', 'verified'].includes(statusLower)) {
    return 'success';
  }
  
  if (['pending', 'warning', 'review', 'caution'].includes(statusLower)) {
    return 'warning';
  }
  
  if (['failed', 'error', 'rejected', 'offline', 'blocked', 'cancelled'].includes(statusLower)) {
    return 'danger';
  }
  
  if (['info', 'new', 'draft', 'scheduled'].includes(statusLower)) {
    return 'info';
  }
  
  return 'default';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  pulse = false,
  tooltip,
  icon,
  className
}) => {
  const finalVariant = variant || getVariantFromStatus(status);
  
  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        'transition-colors duration-200',
        variantStyles[finalVariant],
        sizeStyles[size],
        pulse && pulseStyles[finalVariant],
        className
      )}
      title={tooltip}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="capitalize">{status}</span>
    </span>
  );

  return badge;
};

// Preset status badges for common use cases
export const ActiveBadge: React.FC<{ className?: string }> = ({ className }) => (
  <StatusBadge status="Active" variant="success" className={className} />
);

export const PendingBadge: React.FC<{ className?: string }> = ({ className }) => (
  <StatusBadge status="Pending" variant="warning" pulse className={className} />
);

export const InactiveBadge: React.FC<{ className?: string }> = ({ className }) => (
  <StatusBadge status="Inactive" variant="neutral" className={className} />
);

export const ErrorBadge: React.FC<{ className?: string }> = ({ className }) => (
  <StatusBadge status="Error" variant="danger" className={className} />
);

export default StatusBadge;