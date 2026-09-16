import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { ChevronDown, ChevronRight, GripVertical, Plus, MoreHorizontal, X } from 'lucide-react';

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
  position: number;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  value: string;
  cards: KanbanCardData[];
  collapsed?: boolean;
  aggregation?: {
    field: string;
    type: 'sum' | 'avg' | 'count' | 'min' | 'max';
    value: number;
  };
}

interface EnhancedKanbanProps {
  columns: KanbanColumnData[];
  onReorderColumns?: (columns: KanbanColumnData[]) => void;
  onReorderCards?: (columnId: string, cards: KanbanCardData[]) => void;
  onMoveCard?: (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    newPosition: number
  ) => void;
  onColumnCollapse?: (columnId: string, collapsed: boolean) => void;
  onCardClick?: (card: KanbanCardData, column: KanbanColumnData) => void;
  onQuickAction?: (action: string, card: KanbanCardData, column: KanbanColumnData) => void;
  renderCard?: (card: KanbanCardData, column: KanbanColumnData) => React.ReactNode;
  className?: string;
}

export const EnhancedKanban: React.FC<EnhancedKanbanProps> = ({
  columns: initialColumns,
  onReorderColumns,
  onReorderCards,
  onMoveCard,
  onColumnCollapse,
  onCardClick,
  onQuickAction,
  renderCard,
  className,
}) => {
  const [columns, setColumns] = useState(initialColumns);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [compactMode, setCompactMode] = useState(false);
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCardData; columnId: string } | null>(
    null
  );

  const handleColumnReorder = useCallback(
    (newOrder: KanbanColumnData[]) => {
      setColumns(newOrder);
      onReorderColumns?.(newOrder);
    },
    [onReorderColumns]
  );

  const handleCardReorder = useCallback(
    (columnId: string, newCards: KanbanCardData[]) => {
      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, cards: newCards } : col))
      );
      onReorderCards?.(columnId, newCards);
    },
    [onReorderCards]
  );

  const handleDragEnd = useCallback(
    (card: KanbanCardData, fromColumnId: string, toColumnId: string, dropIndex: number) => {
      setDraggedCard(null);

      if (fromColumnId === toColumnId) return;

      setColumns((prev) => {
        const fromCol = prev.find((c) => c.id === fromColumnId);
        const toCol = prev.find((c) => c.id === toColumnId);

        if (!fromCol || !toCol) return prev;

        const newFromCards = fromCol.cards.filter((c) => c.id !== card.id);
        const cardWithNewPosition = { ...card, position: dropIndex };
        const newToCards = [...toCol.cards];
        newToCards.splice(dropIndex, 0, cardWithNewPosition);

        return prev.map((col) => {
          if (col.id === fromColumnId) return { ...col, cards: newFromCards };
          if (col.id === toColumnId) return { ...col, cards: newToCards };
          return col;
        });
      });

      onMoveCard?.(card.id, fromColumnId, toColumnId, dropIndex);
    },
    [onMoveCard]
  );

  const toggleColumnCollapse = useCallback(
    (columnId: string) => {
      setCollapsedColumns((prev) => {
        const next = new Set(prev);
        if (next.has(columnId)) {
          next.delete(columnId);
        } else {
          next.add(columnId);
        }
        return next;
      });
      onColumnCollapse?.(columnId, !collapsedColumns.has(columnId));
    },
    [collapsedColumns, onColumnCollapse]
  );

  const toggleCompactMode = useCallback(() => {
    setCompactMode((prev) => !prev);
  }, []);

  const handleCardClick = useCallback(
    (card: KanbanCardData, column: KanbanColumnData) => {
      onCardClick?.(card, column);
    },
    [onCardClick]
  );

  const handleQuickAction = useCallback(
    (action: string, card: KanbanCardData, column: KanbanColumnData) => {
      onQuickAction?.(action, card, column);
    },
    [onQuickAction]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
          <button
            onClick={toggleCompactMode}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm',
              compactMode
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            )}
          >
            {compactMode ? 'Expanded' : 'Compact'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Drag to reorder columns</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <Reorder.Group
          axis="x"
          values={columns}
          onReorder={handleColumnReorder}
          className="flex gap-4 min-h-full"
        >
          {columns.map((column) => {
            const isCollapsed = collapsedColumns.has(column.id);

            return (
              <Reorder.Item key={column.id} value={column} className="flex-shrink-0">
                <KanbanColumn
                  column={column}
                  isCollapsed={isCollapsed}
                  compactMode={compactMode}
                  onCollapse={() => toggleColumnCollapse(column.id)}
                  onCardClick={handleCardClick}
                  onQuickAction={handleQuickAction}
                  onCardReorder={(cards) => handleCardReorder(column.id, cards)}
                  onDragEnd={handleDragEnd}
                  draggedCard={draggedCard}
                  setDraggedCard={setDraggedCard}
                  renderCard={renderCard}
                />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  column: KanbanColumnData;
  isCollapsed: boolean;
  compactMode: boolean;
  onCollapse: () => void;
  onCardClick: (card: KanbanCardData, column: KanbanColumnData) => void;
  onQuickAction: (action: string, card: KanbanCardData, column: KanbanColumnData) => void;
  onCardReorder: (cards: KanbanCardData[]) => void;
  onDragEnd: (
    card: KanbanCardData,
    fromColumnId: string,
    toColumnId: string,
    dropIndex: number
  ) => void;
  draggedCard: { card: KanbanCardData; columnId: string } | null;
  setDraggedCard: (card: { card: KanbanCardData; columnId: string } | null) => void;
  renderCard?: (card: KanbanCardData, column: KanbanColumnData) => React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  isCollapsed,
  compactMode,
  onCollapse,
  onCardClick,
  onQuickAction,
  onCardReorder,
  onDragEnd,
  draggedCard,
  setDraggedCard,
  renderCard,
}) => {
  const totalValue = useMemo(() => {
    if (!column.aggregation) return null;
    const { type, value } = column.aggregation;
    switch (type) {
      case 'sum':
        return `$${value.toLocaleString()}`;
      case 'avg':
        return `${value.toFixed(1)} avg`;
      case 'count':
        return `${value} items`;
      default:
        return value;
    }
  }, [column.aggregation]);

  return (
    <motion.div
      layout
      className={cn(
        'flex flex-col rounded-xl w-72',
        'bg-gray-100/80 dark:bg-gray-900/50',
        'border border-gray-200 dark:border-gray-800'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          <button
            onClick={onCollapse}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{column.title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
            {column.cards.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {totalValue && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{totalValue}</span>
          )}
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 overflow-y-auto p-2 space-y-2"
          >
            <Reorder.Group
              axis="y"
              values={column.cards}
              onReorder={onCardReorder}
              className="space-y-2"
            >
              {column.cards.map((card) => (
                <KanbanCardItem
                  key={card.id}
                  card={card}
                  column={column}
                  compactMode={compactMode}
                  onClick={() => onCardClick(card, column)}
                  onQuickAction={(action) => onQuickAction(action, card, column)}
                  onDragEnd={(dropIndex) => onDragEnd(card, column.id, column.id, dropIndex)}
                  draggedCard={draggedCard}
                  setDraggedCard={setDraggedCard}
                  renderCard={renderCard}
                />
              ))}
            </Reorder.Group>

            <button
              className={cn(
                'w-full flex items-center justify-center gap-1 py-2 rounded-lg',
                'text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                'hover:bg-gray-200 dark:hover:bg-gray-800',
                'transition-colors'
              )}
            >
              <Plus className="w-4 h-4" />
              Add card
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="p-2 text-center text-xs text-gray-400"
          >
            {column.cards.length} cards
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface KanbanCardItemProps {
  card: KanbanCardData;
  column: KanbanColumnData;
  compactMode: boolean;
  onClick: () => void;
  onQuickAction: (action: string) => void;
  onDragEnd: (dropIndex: number) => void;
  draggedCard: { card: KanbanCardData; columnId: string } | null;
  setDraggedCard: (card: { card: KanbanCardData; columnId: string } | null) => void;
  renderCard?: (card: KanbanCardData, column: KanbanColumnData) => React.ReactNode;
}

const KanbanCardItem: React.FC<KanbanCardItemProps> = ({
  card,
  column,
  compactMode,
  onClick,
  onQuickAction,
  onDragEnd,
  draggedCard,
  setDraggedCard,
  renderCard,
}) => {
  const dragControls = useDragControls();

  const handleDragStart = () => {
    setDraggedCard({ card, columnId: column.id });
  };

  const handleDragEnd = (event: any, info: any) => {
    setDraggedCard(null);
  };

  if (renderCard) {
    return (
      <Reorder.Item
        value={card}
        dragListener={false}
        dragControls={dragControls}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {renderCard(card, column)}
      </Reorder.Item>
    );
  }

  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        layout
        onClick={onClick}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.no-drag')) return;
          dragControls.start(e);
        }}
        className={cn(
          'group relative p-3 rounded-lg cursor-pointer',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'hover:border-primary/50 dark:hover:border-primary/50',
          'hover:shadow-md transition-all',
          compactMode ? 'py-2 px-3' : 'py-3 px-4'
        )}
      >
        <div className={cn('flex items-start gap-2', compactMode ? 'flex-row' : 'flex-col')}>
          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                'font-medium text-gray-900 dark:text-gray-100',
                compactMode ? 'text-sm' : 'text-base'
              )}
            >
              {card.title}
            </h4>

            {card.subtitle && !compactMode && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.subtitle}</p>
            )}
          </div>
        </div>

        <div
          className={cn('flex items-center justify-between mt-2', compactMode ? 'hidden' : 'flex')}
        >
          <div className="flex items-center gap-2">
            {card.meta?.tags?.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('edit');
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <span className="text-xs">Edit</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction('delete');
              }}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

export default EnhancedKanban;
