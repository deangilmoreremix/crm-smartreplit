import React from 'react';
import { cn } from '../utils/cn';
import type { KanbanColumnData } from './KanbanBoard';

interface KanbanColumnProps {
  column: KanbanColumnData;
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  children,
  onDragOver,
  onDrop,
  className,
}) => {
  return (
    <div
      className={cn('flex-shrink-0 w-80 bg-gray-50 rounded-lg flex flex-col max-h-full', className)}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{column.title}</h3>
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {column.count}
          </span>
        </div>
        {column.aggregation && (
          <div className="mt-1 text-sm text-gray-600">
            {column.aggregation.type === 'sum' && (
              <span className="font-medium">${column.aggregation.value.toLocaleString()}</span>
            )}
            {column.aggregation.type === 'avg' && (
              <span className="font-medium">Avg: ${column.aggregation.value.toLocaleString()}</span>
            )}
            {column.aggregation.type === 'count' && (
              <span className="font-medium">{column.aggregation.value} items</span>
            )}
            {column.aggregation.type === 'min' && (
              <span className="font-medium">Min: ${column.aggregation.value.toLocaleString()}</span>
            )}
            {column.aggregation.type === 'max' && (
              <span className="font-medium">Max: ${column.aggregation.value.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">{children}</div>
    </div>
  );
};
