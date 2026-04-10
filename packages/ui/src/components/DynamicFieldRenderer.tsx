import React from 'react';
import { cn } from '../utils/cn';

interface DynamicFieldRendererProps {
  type: string;
  value: any;
  options?: Array<{ value: string; label: string; color?: string }>;
  className?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  type,
  value,
  options = [],
  className,
}) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  switch (type) {
    case 'TEXT':
    case 'RICH_TEXT':
      return <span className={cn('text-gray-900', className)}>{String(value)}</span>;

    case 'NUMBER':
      return (
        <span className={cn('text-gray-900 tabular-nums', className)}>
          {Number(value).toLocaleString()}
        </span>
      );

    case 'CURRENCY':
      return (
        <span className={cn('text-gray-900 tabular-nums', className)}>
          $
          {Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );

    case 'DATE':
      return (
        <span className={cn('text-gray-900', className)}>
          {new Date(value).toLocaleDateString()}
        </span>
      );

    case 'DATE_TIME':
      return (
        <span className={cn('text-gray-900', className)}>{new Date(value).toLocaleString()}</span>
      );

    case 'SELECT':
      const option = options.find((o) => o.value === value);
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            option?.color || 'bg-gray-100 text-gray-800',
            className
          )}
        >
          {option?.label || value}
        </span>
      );

    case 'MULTI_SELECT':
      const values = Array.isArray(value) ? value : [value];
      return (
        <div className={cn('flex flex-wrap gap-1', className)}>
          {values.map((v, i) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  opt?.color || 'bg-gray-100 text-gray-800'
                )}
              >
                {opt?.label || v}
              </span>
            );
          })}
        </div>
      );

    case 'BOOLEAN':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
            className
          )}
        >
          {value ? 'Yes' : 'No'}
        </span>
      );

    case 'EMAIL':
      return (
        <a
          href={`mailto:${value}`}
          className={cn('text-green-600 hover:text-green-800', className)}
        >
          {value}
        </a>
      );

    case 'PHONE':
      return (
        <a href={`tel:${value}`} className={cn('text-green-600 hover:text-green-800', className)}>
          {value}
        </a>
      );

    case 'URL':
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-green-600 hover:text-green-800 truncate max-w-[200px] inline-block',
            className
          )}
        >
          {value}
        </a>
      );

    case 'JSON':
      return (
        <pre className={cn('text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32', className)}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );

    case 'ARRAY':
      const arr = Array.isArray(value) ? value : [value];
      return (
        <div className={cn('flex flex-wrap gap-1', className)}>
          {arr.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );

    default:
      return <span className={cn('text-gray-900', className)}>{String(value)}</span>;
  }
};
