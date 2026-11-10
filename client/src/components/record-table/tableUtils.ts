import type { AggregateKind, RecordColumn } from './types';
import { isEmptyValue } from './filters';

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export function computeAggregate(values: unknown[], kind: AggregateKind): number {
  if (kind === 'count') return values.filter((v) => !isEmptyValue(v)).length;
  const nums = values.map(num).filter((n): n is number => n !== null);
  const sum = nums.reduce((a, b) => a + b, 0);
  return kind === 'sum' ? sum : nums.length ? sum / nums.length : 0;
}

export interface RowGroup<T> {
  key: string;
  label: string;
  rows: T[];
}

/** Groups rows by a column's value, keeping first-seen order; empty values go to "(empty)". */
export function groupRows<T>(rows: T[], column: RecordColumn<T>): RowGroup<T>[] {
  const map = new Map<string, RowGroup<T>>();
  for (const row of rows) {
    const raw = column.accessor(row);
    const key = isEmptyValue(raw) ? '' : String(raw);
    const label = key === '' ? '(empty)' : column.options?.find((o) => o.value === key)?.label ?? key;
    const g = map.get(key) ?? { key, label, rows: [] };
    g.rows.push(row);
    map.set(key, g);
  }
  return [...map.values()];
}

export const cellText = (v: unknown): string =>
  v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join('; ') : String(v);
