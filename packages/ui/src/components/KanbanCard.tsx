import React from 'react';
import { cn } from '../utils/cn';

interface KanbanCardProps {
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ title, subtitle, footer, className, children }) => (
  <div className={cn('bg-white rounded-md border border-gray-200 p-3 shadow-sm', className)}>
    <div className="font-medium text-gray-900 text-sm">{title}</div>
    {subtitle && <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div>}
    {children}
    {footer && <div className="mt-2">{footer}</div>}
  </div>
);
