import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WidgetContainer } from './WidgetContainer';
import type { MetricWidgetData } from '@smartcrm/shared/dashboard';

interface MetricWidgetProps {
  title: string;
  description?: string;
  data: MetricWidgetData;
  className?: string;
  onSettingsClick?: () => void;
}

const formatValue = (value: number | string, format?: string, unit?: string): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'duration':
      return `${value} days`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  title,
  description,
  data,
  className,
  onSettingsClick,
}) => {
  const { value, unit, trend, target, format } = data;

  const displayValue = formatValue(value, format, unit);

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-zinc-500 dark:text-zinc-400';
    }
  };

  const getProgressPercentage = () => {
    if (!target || typeof value !== 'number') return null;
    return Math.min((value / target) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <WidgetContainer
      title={title}
      description={description}
      className={cn('min-h-[140px]', className)}
      onSettingsClick={onSettingsClick}
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {displayValue}
            {unit && <span className="text-lg text-zinc-500 ml-1">{unit}</span>}
          </div>

          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '' : ''}
                {typeof trend.value === 'number' ? trend.value.toFixed(1) : trend.value}
                {trend.label && (
                  <span className="text-zinc-500 dark:text-zinc-400 ml-1">{trend.label}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {progressPercentage !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default MetricWidget;
