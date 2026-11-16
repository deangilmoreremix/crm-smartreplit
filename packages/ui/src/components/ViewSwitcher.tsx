import React from 'react';
import { cn } from '../utils/cn';

export type ViewSwitcherType = 'table' | 'kanban' | 'calendar';

interface ViewSwitcherProps {
  value: ViewSwitcherType;
  onChange: (view: ViewSwitcherType) => void;
  views?: ViewSwitcherType[];
  className?: string;
}

const LABELS: Record<ViewSwitcherType, string> = {
  table: 'Table',
  kanban: 'Kanban',
  calendar: 'Calendar',
};

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  value,
  onChange,
  views = ['table', 'kanban'],
  className,
}) => (
  <div className={cn('inline-flex rounded-md border border-gray-300 overflow-hidden', className)} role="group">
    {views.map((view) => (
      <button
        key={view}
        type="button"
        aria-pressed={value === view}
        onClick={() => onChange(view)}
        className={cn(
          'px-3 py-1.5 text-sm font-medium',
          value === view ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        {LABELS[view]}
      </button>
    ))}
  </div>
);
