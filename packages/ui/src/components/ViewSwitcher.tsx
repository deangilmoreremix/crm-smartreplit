import React from 'react';
import { cn } from '../utils/cn';

export type ViewType = 'table' | 'kanban' | 'calendar';

export interface ViewSwitcherProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
  views?: ViewType[];
  className?: string;
}

const LABELS: Record<ViewType, string> = { table: 'Table', kanban: 'Kanban', calendar: 'Calendar' };

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  value,
  onChange,
  views = ['table', 'kanban', 'calendar'],
  className,
}) => (
  <div
    role="tablist"
    aria-label="View"
    className={cn('inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800', className)}
  >
    {views.map((view) => {
      const active = view === value;
      return (
        <button
          key={view}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(view)}
          className={cn(
            'rounded px-3 py-1 text-sm font-medium transition-colors',
            active
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
          )}
        >
          {LABELS[view]}
        </button>
      );
    })}
  </div>
);
