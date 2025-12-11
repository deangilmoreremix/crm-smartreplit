import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Phone, Mail, Calendar, Users, FileText } from 'lucide-react';

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  disabled?: boolean;
  badge?: number;
  tooltip?: string;
}

interface QuickActionsProps {
  actions: Action[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

const colorVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  neutral: 'bg-gray-600 hover:bg-gray-700 text-white'
};

const sizeVariants = {
  sm: 'p-2 text-xs',
  md: 'p-3 text-sm',
  lg: 'p-4 text-base'
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  layout = 'grid',
  size = 'md',
  className,
  title
}) => {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex space-x-2 overflow-x-auto';
      case 'vertical':
        return 'flex flex-col space-y-2';
      case 'grid':
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      
      <div className={getLayoutClasses()}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.tooltip}
            className={cn(
              'relative flex items-center justify-center rounded-lg border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              sizeVariants[size],
              action.disabled 
                ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
                : colorVariants[action.color || 'primary'],
              'hover:scale-105 hover:shadow-md',
              layout === 'horizontal' && 'min-w-[120px]'
            )}
          >
            <div className="flex items-center space-x-2">
              <span className="flex-shrink-0">
                {action.icon}
              </span>
              {(layout === 'horizontal' || layout === 'vertical') && (
                <span className="font-medium truncate">
                  {action.label}
                </span>
              )}
            </div>
            
            {action.badge && action.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Predefined common actions
export const commonActions: Omit<Action, 'onClick'>[] = [
  {
    id: 'add-contact',
    label: 'Add Contact',
    icon: <Plus className="w-5 h-5" />,
    color: 'primary'
  },
  {
    id: 'make-call',
    label: 'Make Call',
    icon: <Phone className="w-5 h-5" />,
    color: 'success'
  },
  {
    id: 'send-email',
    label: 'Send Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'primary'
  },
  {
    id: 'schedule-meeting',
    label: 'Schedule Meeting',
    icon: <Calendar className="w-5 h-5" />,
    color: 'warning'
  },
  {
    id: 'add-deal',
    label: 'Add Deal',
    icon: <Users className="w-5 h-5" />,
    color: 'success'
  },
  {
    id: 'create-task',
    label: 'Create Task',
    icon: <FileText className="w-5 h-5" />,
    color: 'neutral'
  }
];

export default QuickActions;