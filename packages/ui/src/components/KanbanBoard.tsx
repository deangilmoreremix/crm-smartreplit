import React from 'react';
import { cn } from '../utils/cn';

export interface KanbanColumnData {
  id: string;
  title: string;
  value: string;
  count: number;
  aggregation?: {
    field: string;
    type: 'sum' | 'avg' | 'min' | 'max' | 'count';
    value: number;
  };
}

export interface KanbanCardData {
  id: string;
  title: string;
  data: Record<string, any>;
  position: number;
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  cards: KanbanCardData[];
  onCardMove: (cardId: string, targetColumnId: string, newPosition: number) => void;
  renderCard: (card: KanbanCardData) => React.ReactNode;
  renderColumnHeader?: (column: KanbanColumnData) => React.ReactNode;
  className?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  cards,
  onCardMove,
  renderCard,
  renderColumnHeader,
  className,
}) => {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map((column) => {
        const columnCards = cards
          .filter((card) => card.data.stage === column.value || card.data.status === column.value)
          .sort((a, b) => a.position - b.position);

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg flex flex-col max-h-full"
          >
            {/* Column Header */}
            {renderColumnHeader ? (
              renderColumnHeader(column)
            ) : (
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {column.count}
                  </span>
                </div>
                {column.aggregation && (
                  <div className="mt-1 text-sm text-gray-600">
                    {column.aggregation.type === 'sum' && (
                      <span>Total: ${column.aggregation.value.toLocaleString()}</span>
                    )}
                    {column.aggregation.type === 'avg' && (
                      <span>Avg: ${column.aggregation.value.toLocaleString()}</span>
                    )}
                    {column.aggregation.type === 'count' && (
                      <span>Count: {column.aggregation.value}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnCards.map((card) => (
                <div key={card.id}>{renderCard(card)}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
