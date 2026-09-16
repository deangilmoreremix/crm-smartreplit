import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useDebounce, useDebouncedCallback } from '@smartcrm/shared/optimization/memoization';
import { cn } from '../../../lib/utils';
import { Search, Filter, X } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableOptimizedProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height?: number;
  onRowClick?: (item: T) => void;
  onSearch?: (term: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
}

interface RowData<T> {
  items: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  rowHeight: number;
}

const MemoizedRow = React.memo(
  function MemoizedRow<T extends { id: string | number }>({
    index,
    style,
    data,
  }: ListChildComponentProps<RowData<T>>) {
    const item = data.items[index];

    return (
      <div
        style={style}
        className={cn(
          'flex items-center border-b border-gray-100 dark:border-gray-800',
          'hover:bg-gray-50 dark:hover:bg-gray-900/50',
          'transition-colors duration-150'
        )}
        onClick={() => data.onRowClick?.(item)}
      >
        {data.columns.map((col, colIndex) => (
          <div
            key={`${item.id}-${String(col.key)}-${colIndex}`}
            className="px-4 py-3 text-sm"
            style={{
              width: col.width ? `${col.width}px` : 'auto',
              flex: col.width ? undefined : 1,
            }}
          >
            {col.render ? col.render(item, index) : String(item[col.key as keyof T] ?? '')}
          </div>
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.style === nextProps.style &&
      prevProps.data.items[prevProps.index] === nextProps.data.items[nextProps.index] &&
      prevProps.data.onRowClick === nextProps.data.onRowClick
    );
  }
);

function DataTableOptimized<T extends { id: string | number }>({
  data,
  columns,
  rowHeight = 56,
  height = 500,
  onRowClick,
  onSearch,
  onFilter,
  searchPlaceholder = 'Search...',
  className,
  emptyMessage = 'No data available',
}: DataTableOptimizedProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedOnSearch = useDebouncedCallback(onSearch ?? (() => {}), 300);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedOnSearch) {
      debouncedOnSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, debouncedOnSearch]);

  const filteredData = useMemo(() => {
    if (!searchTerm && Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((item) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = columns.some((col) => {
          const value = item[col.key as keyof T];
          return value !== undefined && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      if (Object.keys(filters).length > 0) {
        const matchesFilters = Object.entries(filters).every(([key, filterValue]) => {
          const itemValue = String(item[key as keyof T] ?? '').toLowerCase();
          return itemValue.includes(filterValue.toLowerCase());
        });
        if (!matchesFilters) return false;
      }

      return true;
    });
  }, [data, searchTerm, filters, columns]);

  const rowData = useMemo<RowData<T>>(
    () => ({
      items: filteredData,
      columns,
      onRowClick,
      rowHeight,
    }),
    [filteredData, columns, onRowClick, rowHeight]
  );

  const handleFilterChange = useCallback(
    (columnKey: string, value: string) => {
      setFilters((prev) => {
        const updated = { ...prev };
        if (value) {
          updated[columnKey] = value;
        } else {
          delete updated[columnKey];
        }
        return updated;
      });
      onFilter?.(filters);
    },
    [filters, onFilter]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    onSearch?.('');
  }, [onSearch]);

  const clearFilters = useCallback(() => {
    setFilters({});
    onFilter?.({});
  }, [onFilter]);

  const totalWidth = columns.reduce((acc, col) => acc + (col.width ?? 150), 0);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full pl-10 pr-10 py-2 rounded-lg',
              'border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-900',
              'text-sm placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'dark:focus:ring-primary/30'
            )}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'border border-gray-200 dark:border-gray-700',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
            'text-sm font-medium',
            showFilters && 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {Object.keys(filters).length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-white text-xs">
              {Object.keys(filters).length}
            </span>
          )}
        </button>

        {(searchTerm || Object.keys(filters).length > 0) && (
          <button
            onClick={() => {
              clearSearch();
              clearFilters();
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          {filteredData.length} of {data.length} items
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          {columns
            .filter((col) => col.sortable)
            .map((col) => (
              <div key={String(col.key)} className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {col.label}:
                </label>
                <input
                  type="text"
                  value={filters[String(col.key)] ?? ''}
                  onChange={(e) => handleFilterChange(String(col.key), e.target.value)}
                  placeholder={`Filter ${col.label}...`}
                  className={cn(
                    'px-3 py-1 rounded border border-gray-200 dark:border-gray-700',
                    'bg-white dark:bg-gray-900',
                    'text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                />
              </div>
            ))}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div style={{ width: '100%', overflow: 'auto' }}>
            <List
              height={height}
              itemCount={filteredData.length}
              itemSize={rowHeight}
              width="100%"
              itemData={rowData}
              overscanCount={5}
            >
              {MemoizedRow}
            </List>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTableOptimized;
