import type React from 'react';

export type ColumnType = 'text' | 'number' | 'date' | 'select' | 'boolean';
export type AggregateKind = 'count' | 'sum' | 'avg';

export interface SelectOption {
  value: string;
  label: string;
}

export interface RecordColumn<T> {
  id: string;
  header: string;
  /** Raw value used for sorting, filtering, grouping, aggregates and export. */
  accessor: (row: T) => unknown;
  type?: ColumnType;
  options?: SelectOption[];
  editable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: number;
  minWidth?: number;
  aggregate?: AggregateKind;
  formatAggregate?: (n: number) => string;
  /** Server-side column name for `filtersToQuery` when it differs from `id`. */
  dbField?: string;
  hideByDefault?: boolean;
}

export interface TableViewState {
  sorting: { id: string; desc: boolean }[];
  filters: import('./filters').FilterGroup;
  search: string;
  groupBy: string | null;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
}

export interface BulkResult {
  succeeded: number;
  errors: { id: string; message: string }[];
}

export interface BulkEditField {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: SelectOption[];
}

/** Pluggable bulk-action backend; every optional method hides its button when absent. */
export interface BulkAdapter<T> {
  editFields?: BulkEditField[];
  updateMany(rows: T[], patch: Record<string, unknown>): Promise<BulkResult>;
  deleteMany(rows: T[]): Promise<BulkResult>;
  addTag?(rows: T[], tag: string): Promise<BulkResult>;
  assignOwner?(rows: T[], ownerId: string): Promise<BulkResult>;
  loadOwnerOptions?(): Promise<SelectOption[]>;
  /** Merges `duplicate` into `primary` (the duplicate is removed). */
  merge?(primary: T, duplicate: T): Promise<void>;
}

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}
