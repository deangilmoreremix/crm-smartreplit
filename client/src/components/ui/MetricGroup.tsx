import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

interface MetricGroupProps {
  title: string;
  subtitle?: string;
  metrics: Metric[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}

export const MetricGroup: React.FC<MetricGroupProps> = ({
  title,
  subtitle,
  metrics,
  layout = 'vertical',
  className
}) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    if (!trend || trend === 'flat') return <Minus className="w-3 h-3 text-gray-400" />;
    return trend === 'up' ? 
      <TrendingUp className="w-3 h-3 text-emerald-500" /> : 
      <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'flat') => {
    if (!trend || trend === 'flat') return 'text-gray-500';
    return trend === 'up' ? 'text-emerald-500' : 'text-red-500';
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex space-x-6 overflow-x-auto';
      case 'grid':
        return 'grid grid-cols-2 gap-4 sm:grid-cols-3';
      default:
        return 'space-y-4';
    }
  };

  return (
    <div className={cn(
      'glass-card rounded-xl border backdrop-blur-sm p-6',
      'bg-white/70 dark:bg-gray-900/70',
      className
    )}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className={getLayoutClasses()}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              'bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50',
              'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors',
              layout === 'horizontal' && 'min-w-[180px] flex-col items-start space-y-2'
            )}
          >
            <div className={cn(
              'flex items-center space-x-2',
              layout === 'horizontal' && 'w-full'
            )}>
              {metric.icon && (
                <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                  {metric.icon}
                </div>
              )}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                {metric.label}
              </span>
            </div>

            <div className={cn(
              'flex items-center space-x-2',
              layout === 'horizontal' && 'w-full justify-between'
            )}>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </span>
              
              {metric.change !== undefined && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className={cn('text-xs font-medium', getTrendColor(metric.trend))}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricGroup;