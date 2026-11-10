import React from 'react';
import { cn } from '../utils/cn';
import type { KanbanCardData } from './KanbanBoard';

export interface KanbanCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  card?: KanbanCardData;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  isDragging?: boolean;
}

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ card, title, subtitle, footer, isDragging, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        isDragging && 'shadow-lg ring-2 ring-blue-400',
        className
      )}
      {...props}
    >
      {(title ?? card?.title) !== undefined && (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title ?? card?.title}</div>
      )}
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
      {children}
      {footer && <div className="mt-2 text-xs text-gray-500">{footer}</div>}
    </div>
  )
);
KanbanCard.displayName = 'KanbanCard';
