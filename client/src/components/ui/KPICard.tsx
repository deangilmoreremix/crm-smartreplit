import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  period?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  primary: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
  success: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
  warning: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
  danger: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  neutral: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
};

const sizeVariants = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  period,
  icon,
  color = 'primary',
  size = 'md',
  className,
  onClick
}) => {
  const getTrendIcon = () => {
    if (!trend || trend === 'flat') return <Minus className="w-4 h-4" />;
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-emerald-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTrendColor = () => {
    if (!trend || trend === 'flat') return 'text-gray-500';
    return trend === 'up' ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <div
      className={cn(
        'glass-card rounded-xl border backdrop-blur-sm transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg cursor-pointer',
        'bg-white/70 dark:bg-gray-900/70',
        sizeVariants[size],
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
          {title}
        </h3>
        {icon && (
          <div className={cn(
            'p-2 rounded-lg transition-colors',
            colorVariants[color]
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {/* Main Value */}
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        
        {/* Change Indicator */}
        {(change !== undefined || period) && (
          <div className="flex items-center space-x-1">
            {change !== undefined && (
              <>
                {getTrendIcon()}
                <span className={cn('text-sm font-medium', getTrendColor())}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </>
            )}
            
            {period && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {period}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;