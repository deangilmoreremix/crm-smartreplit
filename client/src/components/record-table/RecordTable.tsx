import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  RowData,
  Updater,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import InlineEditCell from '../InlineEditCell';
import SavedViewsMenu from '../SavedViewsMenu';
import RecordDrawer from '../RecordDrawer';
import type { SavedView } from '../../hooks/useSavedViews';
import BulkActionBar from './BulkActionBar';
import FilterBuilder from './FilterBuilder';
import RowContextMenu from './RowContextMenu';
import { applyFilters, compareValues, hasActiveFilters, emptyGroup } from './filters';
import { LARGE_EXPORT_THRESHOLD, exportCsv, exportXlsx } from './exporters';
import { SelectionState, emptySelection, pruneSelection, toggleAll, toggleRow } from './selection';
import { cellText, computeAggregate, groupRows } from './tableUtils';
import type { BulkAdapter, RecordColumn, RowMenuItem, TableViewState } from './types';
import { defaultViewState, deserializeView, serializeView } from './viewState';
import { useSafeNavigate } from './useSafeNavigate';

// TanStack Table v9: features are registered explicitly and must be stable (module scope).
const features = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  sortedRowModel: createSortedRowModel(),
});

const ROW_H = 36;
const CHECK_W = 40;
const VIRTUALIZE_ABOVE = 150;

export interface RecordDrawerConfig<T extends RowData> {
  title: (row: T) => string;
  subtitle?: (row: T) => string | undefined;
  openHref?: (row: T) => string;
  /** Custom drawer body; defaults to a list of the row's column values. */
  render?: (row: T, close: () => void) => React.ReactNode;
}

export interface RecordTableProps<T extends RowData> {
  data: T[];
  /** Keep this array referentially stable (module constant or useMemo). */
  columns: RecordColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  /** Persist/restore views for this object type (contacts, companies, deals, tasks). */
  objectType?: string;
  searchLabel?: string;
  initialView?: Partial<TableViewState>;
  onRowClick?: (row: T) => void;
  onCellEdit?: (row: T, column: RecordColumn<T>, value: string | number) => Promise<void>;
  bulkAdapter?: BulkAdapter<T>;
  /** Called after bulk/context-menu changes so the parent can reload. */
  onDataChanged?: () => void;
  rowLabel?: (row: T) => string;
  /** Extra right-click actions (built-in delete/merge are appended when a bulkAdapter exists). */
  rowMenu?: (row: T) => RowMenuItem[];
  drawer?: RecordDrawerConfig<T>;
  exportName?: string;
  toolbarExtra?: React.ReactNode;
}

const useOutside = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, close]);
  return ref;
};

type Item<T extends RowData> =
  | { kind: 'group'; key: string; label: string; count: number; collapsed: boolean }
  | { kind: 'row'; row: T; id: string; index: number };

function RecordTable<T extends RowData>({
  data,
  columns,
  getRowId,
  loading,
  error,
  onRetry,
  emptyMessage = 'No records yet.',
  objectType,
  searchLabel = 'Search',
  initialView,
  onRowClick,
  onCellEdit,
  bulkAdapter,
  onDataChanged,
  rowLabel,
  rowMenu,
  drawer,
  exportName = 'export',
  toolbarExtra,
}: RecordTableProps<T>) {
  const navigate = useSafeNavigate();
  const colMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const hiddenDefaults = useMemo(
    () => Object.fromEntries(columns.filter((c) => c.hideByDefault).map((c) => [c.id, false])),
    [columns]
  );
  const baseView = useCallback(
    (): TableViewState => ({ ...defaultViewState(), columnVisibility: { ...hiddenDefaults } }),
    [hiddenDefaults]
  );
  const [view, setView] = useState<TableViewState>(() => ({ ...baseView(), ...initialView }));
  const patchView = useCallback((p: Partial<TableViewState>) => setView((v) => ({ ...v, ...p })), []);
  const [selection, setSelection] = useState<SelectionState>(emptySelection);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colsRef = useOutside(showColumns, () => setShowColumns(false));
  const exportRef = useOutside(showExport, () => setShowExport(false));

  const getValue = useCallback((row: T, field: string) => colMap.get(field)?.accessor(row), [colMap]);

  const filtered = useMemo(() => {
    const q = view.search.trim().toLowerCase();
    const searched = q
      ? data.filter((r) => columns.some((c) => cellText(c.accessor(r)).toLowerCase().includes(q)))
      : data;
    return applyFilters(searched, view.filters, getValue);
  }, [data, columns, view.search, view.filters, getValue]);

  const defs = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: c.header,
        accessorFn: (row: T) => c.accessor(row),
        size: c.width ?? 160,
        minSize: c.minWidth ?? 60,
        sortFn: (a, b, id) => compareValues(a.getValue(id), b.getValue(id)),
        sortUndefined: 'last',
      })),
    [columns]
  );

  const fn = <V,>(u: Updater<V>, prev: V): V => (typeof u === 'function' ? (u as (p: V) => V)(prev) : u);
  const table = useTable({
    features,
    data: filtered,
    columns: defs,
    getRowId,
    state: {
      sorting: view.sorting,
      columnOrder: view.columnOrder,
      columnVisibility: view.columnVisibility,
      columnSizing: view.columnSizing,
    },
    onSortingChange: (u) => setView((v) => ({ ...v, sorting: fn(u, v.sorting) })),
    onColumnOrderChange: (u) => setView((v) => ({ ...v, columnOrder: fn(u, v.columnOrder) })),
    onColumnVisibilityChange: (u) => setView((v) => ({ ...v, columnVisibility: fn(u, v.columnVisibility) })),
    onColumnSizingChange: (u) => setView((v) => ({ ...v, columnSizing: fn(u, v.columnSizing) })),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableMultiSort: true,
  });

  const sortedRows = table.getRowModel().rows;
  const visibleCols = table.getVisibleLeafColumns();
  const totalWidth = CHECK_W + visibleCols.reduce((n, c) => n + c.getSize(), 0);
  const groupCol = view.groupBy ? colMap.get(view.groupBy) : undefined;

  const items = useMemo<Item<T>[]>(() => {
    const originals = sortedRows.map((r) => r.original);
    let index = 0;
    const rowItem = (row: T): Item<T> => ({ kind: 'row', row, id: getRowId(row), index: index++ });
    if (!groupCol) return originals.map(rowItem);
    return groupRows(originals, groupCol).flatMap((g) => {
      const isCollapsed = collapsed.has(g.key);
      const head: Item<T> = { kind: 'group', key: g.key, label: g.label, count: g.rows.length, collapsed: isCollapsed };
      return isCollapsed ? [head] : [head, ...g.rows.map(rowItem)];
    });
  }, [sortedRows, groupCol, collapsed, getRowId]);

  const orderedIds = useMemo(
    () => items.flatMap((i) => (i.kind === 'row' ? [i.id] : [])),
    [items]
  );
  const allIds = useMemo(() => sortedRows.map((r) => r.id), [sortedRows]);

  useEffect(() => {
    setSelection((s) => pruneSelection(s, new Set(data.map(getRowId))));
  }, [data, getRowId]);

  const selectedRows = useMemo(
    () => data.filter((r) => selection.selected.has(getRowId(r))),
    [data, selection, getRowId]
  );

  const virtualize = items.length > VIRTUALIZE_ABOVE;
  const virtualizer = useVirtualizer({
    count: virtualize ? items.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  /* ---------- keyboard navigation between editable cells ---------- */
  const cellSelector = (r: number, c: number) => `[data-edit-cell][data-r="${r}"][data-c="${c}"] [role="button"]`;
  const focusEl = (el: Element | null | undefined) => {
    (el as HTMLElement | null | undefined)?.focus();
    return !!el;
  };
  const focusRelative = (r: number, c: number, dir: 1 | -1) => {
    const nodes = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>('[data-edit-cell]') ?? []);
    const idx = nodes.findIndex((n) => n.dataset.r === String(r) && n.dataset.c === String(c));
    focusEl(nodes[idx + dir]?.querySelector('[role="button"]'));
  };
  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') !== 'button') return;
    const cell = target.closest<HTMLElement>('[data-edit-cell]');
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const root = scrollRef.current;
    if (!root) return;
    const q = (rr: number, cc: number) => root.querySelector(cellSelector(rr, cc));
    let moved = false;
    if (e.key === 'ArrowDown') moved = focusEl(q(r + 1, c));
    else if (e.key === 'ArrowUp') moved = focusEl(q(r - 1, c));
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const step = e.key === 'ArrowRight' ? 1 : -1;
      for (let cc = c + step; cc >= 0 && cc < visibleCols.length && !moved; cc += step) moved = focusEl(q(r, cc));
    } else return;
    if (moved) e.preventDefault();
  };

  /* ---------- context menu ---------- */
  const labelOf = rowLabel ?? ((r: T) => getRowId(r));
  const menuFor = (row: T): RowMenuItem[] => {
    const items: RowMenuItem[] = [...(rowMenu?.(row) ?? [])];
    const id = getRowId(row);
    if (bulkAdapter?.merge && selection.selected.size === 2 && selection.selected.has(id)) {
      const other = selectedRows.find((r) => getRowId(r) !== id);
      if (other)
        items.push({
          label: `Merge ${labelOf(other)} into this`,
          separatorBefore: true,
          onSelect: () => {
            if (!window.confirm(`Merge ${labelOf(other)} into ${labelOf(row)}? ${labelOf(other)} will be deleted.`)) return;
            bulkAdapter.merge!(row, other).then(
              () => {
                setNotice('Merged 2 records.');
                onDataChanged?.();
              },
              (e) => setNotice(`Merge failed: ${e instanceof Error ? e.message : String(e)}`)
            );
          },
        });
    }
    if (bulkAdapter) {
      items.push({
        label: 'Delete',
        destructive: true,
        separatorBefore: true,
        onSelect: () => {
          if (!window.confirm(`Delete ${labelOf(row)}? This cannot be undone.`)) return;
          bulkAdapter.deleteMany([row]).then(
            (res) => {
              setNotice(res.errors.length ? `Delete failed: ${res.errors[0].message}` : 'Deleted 1 record.');
              if (res.succeeded) onDataChanged?.();
            },
            (e) => setNotice(`Delete failed: ${e instanceof Error ? e.message : String(e)}`)
          );
        },
      });
    }
    return items;
  };

  /* ---------- saved views ---------- */
  const serialized = serializeView(view);
  const applyStored = (v: SavedView<Record<string, unknown>>) =>
    setView({ ...baseView(), ...deserializeView({ filters: v.filters, sort: v.sort, columns: v.columns }) });

  /* ---------- export ---------- */
  const exportColumns = visibleCols.map((c) => colMap.get(c.id)!).filter(Boolean);
  const exportRows = sortedRows.map((r) => r.original);
  const runExport = async (kind: 'csv' | 'xlsx') => {
    setShowExport(false);
    setNotice(
      exportRows.length > LARGE_EXPORT_THRESHOLD
        ? `Large export (${exportRows.length} rows): building the file in chunks, this may take a moment.`
        : null
    );
    try {
      await (kind === 'csv' ? exportCsv : exportXlsx)(exportRows, exportColumns, exportName);
      if (exportRows.length > LARGE_EXPORT_THRESHOLD) setNotice(`Exported ${exportRows.length} rows.`);
    } catch (e) {
      setNotice(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  /* ---------- rendering ---------- */
  const drawerRow = drawerId ? data.find((r) => getRowId(r) === drawerId) : undefined;
  const openRow = (row: T) => {
    if (drawer) setDrawerId(getRowId(row));
    onRowClick?.(row);
  };

  const renderCell = (col: RecordColumn<T>, row: T, r: number, c: number) => {
    const value = col.accessor(row);
    const display = col.render ? col.render(row) : undefined;
    if (col.editable && onCellEdit) {
      return (
        <div data-edit-cell data-r={r} data-c={c} onClick={(e) => e.stopPropagation()} className="truncate">
          <InlineEditCell
            value={value as string | number | null | undefined}
            type={col.type === 'number' ? 'number' : col.type === 'select' ? 'select' : 'text'}
            options={col.options}
            placeholder="-"
            onSave={(v) => onCellEdit(row, col, v)}
            onTab={(shift) => focusRelative(r, c, shift ? -1 : 1)}
          >
            {display}
          </InlineEditCell>
        </div>
      );
    }
    return <span className="truncate">{display ?? cellText(value)}</span>;
  };

  const renderItem = (item: Item<T>, style?: React.CSSProperties) => {
    if (item.kind === 'group') {
      return (
        <div
          key={`g-${item.key}`}
          role="row"
          style={{ ...style, minWidth: totalWidth, height: ROW_H }}
          className="flex items-center bg-gray-100 border-b px-3 text-sm font-medium"
        >
          <button
            type="button"
            aria-expanded={!item.collapsed}
            onClick={() =>
              setCollapsed((s) => {
                const n = new Set(s);
                if (n.has(item.key)) n.delete(item.key);
                else n.add(item.key);
                return n;
              })
            }
            className="flex items-center gap-2"
          >
            <span aria-hidden>{item.collapsed ? '▸' : '▾'}</span>
            {item.label} <span className="text-gray-500 font-normal">({item.count})</span>
          </button>
        </div>
      );
    }
    const { row, id, index } = item;
    const selected = selection.selected.has(id);
    const line = (
      <div
        role="row"
        aria-selected={selected}
        style={{ ...style, minWidth: totalWidth, height: ROW_H }}
        onClick={() => openRow(row)}
        className={`flex items-center border-b text-sm hover:bg-gray-50 ${onRowClick || drawer ? 'cursor-pointer' : ''} ${
          selected ? 'bg-blue-50' : 'bg-white'
        }`}
      >
        <div role="cell" style={{ width: CHECK_W }} className="shrink-0 flex justify-center">
          <input
            type="checkbox"
            aria-label="Select row"
            checked={selected}
            onChange={() => undefined}
            onClick={(e) => {
              e.stopPropagation();
              setSelection((s) => toggleRow(s, orderedIds, id, e.shiftKey));
            }}
          />
        </div>
        {visibleCols.map((vc, c) => {
          const col = colMap.get(vc.id)!;
          return (
            <div key={vc.id} role="cell" style={{ width: vc.getSize() }} className="shrink-0 px-2 truncate">
              {renderCell(col, row, index, c)}
            </div>
          );
        })}
      </div>
    );
    return (
      <RowContextMenu key={id} items={menuFor(row)}>
        {line}
      </RowContextMenu>
    );
  };

  const allSelected = allIds.length > 0 && allIds.every((i) => selection.selected.has(i));
  const filterCount = hasActiveFilters(view.filters);
  const btn = 'px-3 py-1.5 text-sm border rounded bg-white hover:bg-gray-50';

  let body: React.ReactNode;
  if (loading) body = <p className="text-sm text-gray-500 p-4">Loading...</p>;
  else if (error)
    body = (
      <div role="alert" className="text-sm text-red-600 p-4">
        {error}{' '}
        {onRetry && (
          <button onClick={onRetry} className="underline">
            Retry
          </button>
        )}
      </div>
    );
  else if (items.length === 0)
    body = (
      <p className="text-sm text-gray-500 p-4">
        {data.length === 0 ? emptyMessage : 'No records match the current filters.'}
      </p>
    );
  else
    body = (
      <div role="table" aria-rowcount={sortedRows.length} style={{ minWidth: totalWidth }}>
        <div role="rowgroup" className="sticky top-0 z-10">
          <div role="row" className="flex bg-gray-50 border-b text-xs uppercase text-gray-500" style={{ minWidth: totalWidth }}>
            <div role="columnheader" style={{ width: CHECK_W }} className="shrink-0 flex justify-center py-2">
              <input
                type="checkbox"
                aria-label="Select all rows"
                checked={allSelected}
                onChange={() => setSelection((s) => toggleAll(s, allIds))}
              />
            </div>
            {visibleCols.map((vc) => {
              const sorted = vc.getIsSorted();
              return (
                <div
                  key={vc.id}
                  role="columnheader"
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                  style={{ width: vc.getSize() }}
                  className="relative shrink-0 px-2 py-2 select-none"
                >
                  <button
                    type="button"
                    onClick={vc.getToggleSortingHandler()}
                    title="Click to sort, Shift+click to add a sort"
                    className="font-medium uppercase flex items-center gap-1"
                  >
                    {colMap.get(vc.id)?.header}
                    {sorted && <span aria-hidden>{sorted === 'asc' ? '▲' : '▼'}</span>}
                    {sorted && view.sorting.length > 1 && (
                      <sup>{view.sorting.findIndex((s) => s.id === vc.id) + 1}</sup>
                    )}
                  </button>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={(e) => vc.getCanResize() && (table.getHeaderGroups()[0].headers.find((h) => h.column.id === vc.id)?.getResizeHandler()(e))}
                    onTouchStart={(e) => table.getHeaderGroups()[0].headers.find((h) => h.column.id === vc.id)?.getResizeHandler()(e)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300"
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div role="rowgroup" style={virtualize ? { height: virtualizer.getTotalSize(), position: 'relative' } : undefined}>
          {virtualize
            ? virtualizer.getVirtualItems().map((v) =>
                renderItem(items[v.index], {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${v.start}px)`,
                })
              )
            : items.map((i) => renderItem(i))}
        </div>
        <div role="rowgroup" className="sticky bottom-0 z-10">
          <div role="row" className="flex bg-gray-50 border-t text-xs font-medium text-gray-600" style={{ minWidth: totalWidth, height: ROW_H }}>
            <div style={{ width: CHECK_W }} className="shrink-0" />
            {visibleCols.map((vc, i) => {
              const col = colMap.get(vc.id)!;
              let text = '';
              if (col.aggregate) {
                const n = computeAggregate(exportRows.map(col.accessor), col.aggregate);
                text = `${col.aggregate} ${col.formatAggregate ? col.formatAggregate(n) : Number.isInteger(n) ? n : n.toFixed(2)}`;
              } else if (i === 0) text = `${sortedRows.length} record${sortedRows.length === 1 ? '' : 's'}`;
              return (
                <div key={vc.id} role="cell" style={{ width: vc.getSize() }} className="shrink-0 px-2 flex items-center truncate">
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

  const moveColumn = (id: string, dir: -1 | 1) => {
    const order = table.getAllLeafColumns().map((c) => c.id);
    const i = order.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    patchView({ columnOrder: order });
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 min-w-0 flex flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            type="search"
            placeholder={searchLabel}
            aria-label={searchLabel}
            value={view.search}
            onChange={(e) => patchView({ search: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm"
          />
          <button type="button" className={btn} aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}>
            Filters{filterCount ? ' •' : ''}
          </button>
          <select
            aria-label="Group by"
            value={view.groupBy ?? ''}
            onChange={(e) => {
              patchView({ groupBy: e.target.value || null });
              setCollapsed(new Set());
            }}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">No grouping</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                Group by {c.header}
              </option>
            ))}
          </select>
          <div ref={colsRef} className="relative">
            <button type="button" className={btn} aria-expanded={showColumns} onClick={() => setShowColumns((s) => !s)}>
              Columns
            </button>
            {showColumns && (
              <div className="absolute z-20 mt-1 w-64 rounded border bg-white p-2 shadow-lg text-sm">
                {table.getAllLeafColumns().map((c) => (
                  <div key={c.id} className="flex items-center gap-2 py-0.5">
                    <label className="flex items-center gap-2 flex-1">
                      <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                      {colMap.get(c.id)?.header}
                    </label>
                    <button type="button" aria-label={`Move ${colMap.get(c.id)?.header} up`} onClick={() => moveColumn(c.id, -1)}>
                      ↑
                    </button>
                    <button type="button" aria-label={`Move ${colMap.get(c.id)?.header} down`} onClick={() => moveColumn(c.id, 1)}>
                      ↓
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-600"
                  onClick={() => patchView({ columnOrder: [], columnVisibility: { ...hiddenDefaults }, columnSizing: {} })}
                >
                  Reset columns
                </button>
              </div>
            )}
          </div>
          <div ref={exportRef} className="relative">
            <button type="button" className={btn} aria-expanded={showExport} onClick={() => setShowExport((s) => !s)}>
              Export
            </button>
            {showExport && (
              <div className="absolute z-20 mt-1 w-44 rounded border bg-white p-1 shadow-lg text-sm">
                <button type="button" className="block w-full text-left px-2 py-1 hover:bg-gray-100" onClick={() => void runExport('csv')}>
                  Export CSV ({exportRows.length})
                </button>
                <button type="button" className="block w-full text-left px-2 py-1 hover:bg-gray-100" onClick={() => void runExport('xlsx')}>
                  Export XLSX ({exportRows.length})
                </button>
              </div>
            )}
          </div>
          {objectType && (
            <SavedViewsMenu
              objectType={objectType}
              viewType="table"
              currentFilters={serialized.filters as unknown as Record<string, unknown>}
              currentSort={serialized.sort}
              currentColumns={serialized.columns}
              onApply={() => undefined}
              onApplyView={applyStored}
            />
          )}
          <div className="ml-auto flex items-center gap-2">{toolbarExtra}</div>
        </div>

        {showFilters && (
          <div className="mb-3">
            <FilterBuilder columns={columns} value={view.filters} onChange={(filters) => patchView({ filters })} />
            {filterCount && (
              <button type="button" className="mt-1 text-xs text-blue-600" onClick={() => patchView({ filters: emptyGroup() })}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {notice && (
          <div role="status" className="mb-2 text-sm text-gray-700">
            {notice}{' '}
            <button type="button" className="underline text-xs" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}

        {bulkAdapter && selectedRows.length > 0 && (
          <BulkActionBar
            rows={selectedRows}
            adapter={bulkAdapter}
            getLabel={labelOf}
            onClear={() => setSelection(emptySelection())}
            onChanged={() => {
              setSelection(emptySelection());
              onDataChanged?.();
            }}
          />
        )}

        <div ref={scrollRef} onKeyDown={onGridKeyDown} className="flex-1 min-h-0 overflow-auto border rounded">
          {body}
        </div>
      </div>

      {drawer && drawerRow && (
        <RecordDrawer
          open
          onClose={() => setDrawerId(null)}
          title={drawer.title(drawerRow)}
          subtitle={drawer.subtitle?.(drawerRow)}
          openHref={drawer.openHref?.(drawerRow)}
          onOpenFull={drawer.openHref ? () => navigate(drawer.openHref!(drawerRow)) : undefined}
        >
          {drawer.render ? (
            drawer.render(drawerRow, () => setDrawerId(null))
          ) : (
            <dl className="text-sm space-y-2">
              {columns.map((c) => (
                <div key={c.id}>
                  <dt className="text-gray-500">{c.header}</dt>
                  <dd>{cellText(c.accessor(drawerRow)) || '-'}</dd>
                </div>
              ))}
            </dl>
          )}
        </RecordDrawer>
      )}
    </div>
  );
}

export default RecordTable;
