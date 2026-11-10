/** Filter model (AND/OR groups) with a client-side evaluator and a PostgREST-style emitter. */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'in';

export interface FilterCondition {
  type: 'condition';
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface FilterGroup {
  type: 'group';
  op: 'and' | 'or';
  children: FilterNode[];
}

export type FilterNode = FilterCondition | FilterGroup;

export const NO_VALUE_OPERATORS: FilterOperator[] = ['isEmpty', 'isNotEmpty'];

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'is',
  neq: 'is not',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  in: 'is one of',
};

export const emptyGroup = (op: 'and' | 'or' = 'and'): FilterGroup => ({ type: 'group', op, children: [] });

export const isEmptyValue = (v: unknown): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** A condition is "complete" when it has what its operator needs; incomplete ones are ignored. */
export function isComplete(c: FilterCondition): boolean {
  if (!c.field) return false;
  if (NO_VALUE_OPERATORS.includes(c.operator)) return true;
  if (c.operator === 'in') return toList(c.value).length > 0;
  return !isEmptyValue(c.value);
}

const toList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : String(v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

const asTime = (v: unknown): number | null => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
};

/** Orders two values: numbers numerically, ISO dates chronologically, everything else as case-insensitive text. */
export function compareValues(a: unknown, b: unknown): number {
  const aEmpty = isEmptyValue(a);
  const bEmpty = isEmptyValue(b);
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  const [an, bn] = [asNumber(a), asNumber(b)];
  if (an !== null && bn !== null) return an - bn;
  const [at, bt] = [asTime(a), asTime(b)];
  if (at !== null && bt !== null) return at - bt;
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}

const text = (v: unknown) => (Array.isArray(v) ? v.join(' ') : String(v ?? '')).toLowerCase();

export function matchesCondition(value: unknown, c: FilterCondition): boolean {
  if (!isComplete(c)) return true;
  switch (c.operator) {
    case 'isEmpty':
      return isEmptyValue(value);
    case 'isNotEmpty':
      return !isEmptyValue(value);
    case 'eq':
      return Array.isArray(value)
        ? value.map(text).includes(text(c.value))
        : isEmptyValue(value)
          ? false
          : compareValues(value, c.value) === 0;
    case 'neq':
      return !matchesCondition(value, { ...c, operator: 'eq' });
    case 'contains':
      return text(value).includes(text(c.value));
    case 'notContains':
      return !text(value).includes(text(c.value));
    case 'startsWith':
      return text(value).startsWith(text(c.value));
    case 'in': {
      const list = toList(c.value).map((s) => s.toLowerCase());
      return Array.isArray(value) ? value.some((v) => list.includes(text(v))) : list.includes(text(value));
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      if (isEmptyValue(value)) return false;
      const cmp = compareValues(value, c.value);
      return c.operator === 'gt' ? cmp > 0 : c.operator === 'gte' ? cmp >= 0 : c.operator === 'lt' ? cmp < 0 : cmp <= 0;
    }
  }
}

/** True when the node (or any descendant) has at least one usable condition. */
export function hasActiveFilters(node: FilterNode): boolean {
  return node.type === 'condition' ? isComplete(node) : node.children.some(hasActiveFilters);
}

export function matchesNode<T>(row: T, node: FilterNode, getValue: (row: T, field: string) => unknown): boolean {
  if (node.type === 'condition') return matchesCondition(getValue(row, node.field), node);
  const active = node.children.filter(hasActiveFilters);
  if (active.length === 0) return true;
  return node.op === 'and'
    ? active.every((c) => matchesNode(row, c, getValue))
    : active.some((c) => matchesNode(row, c, getValue));
}

const defaultGetValue = <T,>(row: T, field: string) => (row as Record<string, unknown>)[field];

/** Client-side evaluation of a filter tree. */
export function applyFilters<T>(
  rows: T[],
  node: FilterNode,
  getValue: (row: T, field: string) => unknown = defaultGetValue
): T[] {
  if (!hasActiveFilters(node)) return rows;
  return rows.filter((r) => matchesNode(r, node, getValue));
}

const quote = (v: string) => (/[,()":*\s]/.test(v) ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : v);

function conditionToPostgrest(c: FilterCondition, col: string): string {
  const v = String(c.value ?? '');
  switch (c.operator) {
    case 'eq':
      return `${col}.eq.${quote(v)}`;
    case 'neq':
      return `${col}.neq.${quote(v)}`;
    case 'contains':
      return `${col}.ilike.${quote(`*${v}*`)}`;
    case 'notContains':
      return `${col}.not.ilike.${quote(`*${v}*`)}`;
    case 'startsWith':
      return `${col}.ilike.${quote(`${v}*`)}`;
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return `${col}.${c.operator}.${quote(v)}`;
    case 'isEmpty':
      return `${col}.is.null`;
    case 'isNotEmpty':
      return `${col}.not.is.null`;
    case 'in':
      return `${col}.in.(${toList(c.value).map(quote).join(',')})`;
  }
}

function nodeToPostgrest(node: FilterNode, fieldMap: Record<string, string>): string | null {
  if (node.type === 'condition') {
    return isComplete(node) ? conditionToPostgrest(node, fieldMap[node.field] ?? node.field) : null;
  }
  const parts = node.children.map((c) => nodeToPostgrest(c, fieldMap)).filter((p): p is string => !!p);
  return parts.length ? `${node.op}(${parts.join(',')})` : null;
}

export interface FilterQuerySpec {
  /** Query-string params for a PostgREST endpoint, e.g. `{ and: "(status.eq.lead,or(a.gt.1,b.lt.2))" }`. Empty when no filter is active. */
  params: Record<string, string>;
  /** `params` rendered as a URL-encoded query string (no leading "?"). */
  queryString: string;
}

/** Emits a PostgREST-style spec for the same tree `applyFilters` evaluates client-side. */
export function filtersToQuery(node: FilterNode, fieldMap: Record<string, string> = {}): FilterQuerySpec {
  const root: FilterGroup = node.type === 'group' ? node : { type: 'group', op: 'and', children: [node] };
  const expr = nodeToPostgrest(root, fieldMap);
  if (!expr) return { params: {}, queryString: '' };
  const params = { [root.op]: expr.slice(root.op.length) };
  return { params, queryString: new URLSearchParams(params).toString() };
}
