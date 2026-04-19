import React, { useMemo, useCallback } from 'react';
import {
  AggregationType,
  AGGREGATION_LABELS,
} from '../../../../packages/shared/src/views/saved-views';
import { cn } from '../../../lib/utils';
import { ChevronDown, Calculator } from 'lucide-react';

interface ColumnConfig {
  field: string;
  label: string;
  aggregation?: AggregationType;
}

interface ColumnAggregatorProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
  onAggregationChange?: (field: string, aggregation: AggregationType | undefined) => void;
  className?: string;
}

interface AggregationResult {
  field: string;
  type: AggregationType;
  value: number;
  formatted: string;
}

function calculateAggregation(
  data: Record<string, any>[],
  field: string,
  type: AggregationType
): number {
  const values = data
    .map((row) => row[field])
    .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number);

  if (values.length === 0) return 0;

  switch (type) {
    case 'sum':
      return values.reduce((acc, v) => acc + v, 0);
    case 'avg':
      return values.reduce((acc, v) => acc + v, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}

function formatAggregationValue(value: number, type: AggregationType): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
  }
}

export const ColumnAggregator: React.FC<ColumnAggregatorProps> = ({
  data,
  columns,
  onAggregationChange,
  className,
}) => {
  const aggregations = useMemo(() => {
    const results: AggregationResult[] = [];

    columns.forEach((col) => {
      if (col.aggregation) {
        const rawValue = calculateAggregation(data, col.field, col.aggregation);
        results.push({
          field: col.field,
          type: col.aggregation,
          value: rawValue,
          formatted: formatAggregationValue(rawValue, col.aggregation),
        });
      }
    });

    return results;
  }, [data, columns]);

  const handleAggregationClick = useCallback(
    (field: string) => {
      if (!onAggregationChange) return;

      const column = columns.find((c) => c.field === field);
      const currentAgg = column?.aggregation;

      let nextAgg: AggregationType | undefined;
      if (!currentAgg) {
        nextAgg = 'sum';
      } else {
        const aggTypes: AggregationType[] = ['sum', 'avg', 'count', 'min', 'max'];
        const currentIndex = aggTypes.indexOf(currentAgg);
        const nextIndex = (currentIndex + 1) % (aggTypes.length + 1);
        nextAgg = nextIndex === aggTypes.length ? undefined : aggTypes[nextIndex];
      }

      onAggregationChange(field, nextAgg);
    },
    [columns, onAggregationChange]
  );

  if (aggregations.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-2',
        'bg-gray-50 dark:bg-gray-900/50',
        'border-t border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        <Calculator className="w-4 h-4" />
        <span className="text-xs font-medium">Aggregations</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {aggregations.map((agg) => (
          <div
            key={agg.field}
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-md',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700'
            )}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {AGGREGATION_LABELS[agg.type]}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {agg.formatted}
            </span>
          </div>
        ))}
      </div>

      {onAggregationChange && (
        <div className="ml-auto">
          <button
            onClick={() => aggregations[0] && handleAggregationClick(aggregations[0].field)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs',
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <ChevronDown className="w-3 h-3" />
            Change
          </button>
        </div>
      )}
    </div>
  );
};

interface ColumnHeaderProps {
  column: ColumnConfig;
  isAggregated?: boolean;
  aggregationValue?: string;
  onAggregationClick?: () => void;
  className?: string;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  isAggregated,
  aggregationValue,
  onAggregationClick,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="font-medium text-gray-900 dark:text-gray-100">{column.label}</span>

      {column.aggregation && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-primary font-medium">
            {AGGREGATION_LABELS[column.aggregation]}
          </span>
          {aggregationValue && (
            <span className="text-xs text-gray-500 dark:text-gray-400">({aggregationValue})</span>
          )}
          {onAggregationClick && (
            <button
              onClick={onAggregationClick}
              className={cn(
                'p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {isAggregated && !column.aggregation && (
        <button
          onClick={onAggregationClick}
          className={cn(
            'ml-1 p-0.5 rounded',
            'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
          )}
          title="Add aggregation"
        >
          <Calculator className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

interface AggregationSelectorProps {
  currentType?: AggregationType;
  onSelect: (type: AggregationType | undefined) => void;
  className?: string;
}

export const AggregationSelector: React.FC<AggregationSelectorProps> = ({
  currentType,
  onSelect,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-2 rounded-lg',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'shadow-lg',
        className
      )}
    >
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Aggregation</div>
      <div className="space-y-1">
        <button
          onClick={() => onSelect(undefined)}
          className={cn(
            'w-full px-3 py-1.5 rounded text-sm text-left',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            !currentType ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          None
        </button>
        {(Object.keys(AGGREGATION_LABELS) as AggregationType[]).map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              'w-full px-3 py-1.5 rounded text-sm text-left',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              currentType === type ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {AGGREGATION_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColumnAggregator;
