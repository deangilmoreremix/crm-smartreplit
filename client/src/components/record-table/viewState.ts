import { emptyGroup, FilterCondition, FilterGroup, FilterNode } from './filters';
import type { TableViewState } from './types';

export const defaultViewState = (): TableViewState => ({
  sorting: [],
  filters: emptyGroup(),
  search: '',
  groupBy: null,
  columnOrder: [],
  columnVisibility: {},
  columnSizing: {},
});

/** Shape stored in the `views.columns` JSONB column (a legacy `[]` means "nothing stored"). */
export interface StoredColumns {
  version: 1;
  order: string[];
  visibility: Record<string, boolean>;
  sizing: Record<string, number>;
  groupBy: string | null;
}

export interface StoredView {
  filters: unknown;
  sort?: unknown;
  columns?: unknown;
}

/** Splits view state into the `filters` / `sort` / `columns` columns of the `views` table. */
export function serializeView(state: TableViewState): { filters: FilterGroup; sort: TableViewState['sorting']; columns: StoredColumns } {
  return {
    filters: state.filters,
    sort: state.sorting,
    columns: {
      version: 1,
      order: state.columnOrder,
      visibility: state.columnVisibility,
      sizing: state.columnSizing,
      groupBy: state.groupBy,
    },
  };
}

const isNode = (v: unknown): v is FilterNode =>
  !!v && typeof v === 'object' && ((v as FilterNode).type === 'group' || (v as FilterNode).type === 'condition');

/**
 * Converts legacy flat filters (`{ search, status, industry }`) saved by the old contacts screen
 * into an AND group of `eq` conditions; `search` is returned separately.
 */
export function legacyFiltersToTree(filters: Record<string, unknown>): { tree: FilterGroup; search: string } {
  const children: FilterCondition[] = [];
  let search = '';
  for (const [field, value] of Object.entries(filters)) {
    if (typeof value !== 'string' || value === '') continue;
    if (field === 'search') search = value;
    else children.push({ type: 'condition', field, operator: 'eq', value });
  }
  return { tree: { type: 'group', op: 'and', children }, search };
}

/** Restores view state from a stored row; tolerant of legacy/empty shapes. Only returns what the row defines. */
export function deserializeView(view: StoredView): Partial<TableViewState> {
  const out: Partial<TableViewState> = {};
  if (isNode(view.filters)) {
    out.filters = view.filters.type === 'group' ? view.filters : { type: 'group', op: 'and', children: [view.filters] };
  } else if (view.filters && typeof view.filters === 'object' && !Array.isArray(view.filters)) {
    const { tree, search } = legacyFiltersToTree(view.filters as Record<string, unknown>);
    out.filters = tree;
    out.search = search;
  } else {
    out.filters = emptyGroup();
  }
  out.sorting = Array.isArray(view.sort)
    ? (view.sort as { id?: unknown; desc?: unknown }[])
        .filter((s) => typeof s?.id === 'string')
        .map((s) => ({ id: s.id as string, desc: !!s.desc }))
    : [];
  const c = view.columns as Partial<StoredColumns> | undefined;
  if (c && !Array.isArray(c) && typeof c === 'object') {
    out.columnOrder = Array.isArray(c.order) ? c.order : [];
    out.columnVisibility = c.visibility ?? {};
    out.columnSizing = c.sizing ?? {};
    out.groupBy = c.groupBy ?? null;
  }
  return out;
}
