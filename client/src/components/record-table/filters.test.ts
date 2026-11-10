import { describe, it, expect } from 'vitest';
import { applyFilters, filtersToQuery, FilterGroup, compareValues } from './filters';

const rows = [
  { id: 1, name: 'Ada', status: 'lead', amount: 10, tags: ['vip'], city: null as string | null },
  { id: 2, name: 'Bob', status: 'customer', amount: 50, tags: [], city: 'Paris' },
  { id: 3, name: 'Cy', status: 'lead', amount: 100, tags: ['vip', 'uk'], city: 'London' },
];
const cond = (field: string, operator: any, value?: unknown) => ({ type: 'condition' as const, field, operator, value });
const group = (op: 'and' | 'or', ...children: FilterGroup['children']): FilterGroup => ({ type: 'group', op, children });
const ids = (r: typeof rows) => r.map((x) => x.id);

describe('applyFilters', () => {
  it('returns everything for an empty tree and ignores incomplete conditions', () => {
    expect(applyFilters(rows, group('and'))).toHaveLength(3);
    expect(applyFilters(rows, group('and', cond('status', 'eq', '')))).toHaveLength(3);
  });

  it('ANDs and ORs conditions, including nested groups', () => {
    expect(ids(applyFilters(rows, group('and', cond('status', 'eq', 'lead'), cond('amount', 'gt', 50))))).toEqual([3]);
    expect(ids(applyFilters(rows, group('or', cond('name', 'startsWith', 'a'), cond('amount', 'gte', 100))))).toEqual([1, 3]);
    const nested = group('and', cond('status', 'eq', 'lead'), group('or', cond('amount', 'lt', 20), cond('city', 'eq', 'London')));
    expect(ids(applyFilters(rows, nested))).toEqual([1, 3]);
  });

  it('supports text, emptiness, list and array operators', () => {
    expect(ids(applyFilters(rows, group('and', cond('name', 'contains', 'O'))))).toEqual([2]);
    expect(ids(applyFilters(rows, group('and', cond('name', 'notContains', 'o'))))).toEqual([1, 3]);
    expect(ids(applyFilters(rows, group('and', cond('city', 'isEmpty'))))).toEqual([1]);
    expect(ids(applyFilters(rows, group('and', cond('city', 'isNotEmpty'))))).toEqual([2, 3]);
    expect(ids(applyFilters(rows, group('and', cond('status', 'in', 'customer, other'))))).toEqual([2]);
    expect(ids(applyFilters(rows, group('and', cond('tags', 'eq', 'uk'))))).toEqual([3]);
    expect(ids(applyFilters(rows, group('and', cond('status', 'neq', 'lead'))))).toEqual([2]);
  });

  it('uses a custom value getter', () => {
    const out = applyFilters(rows, group('and', cond('upper', 'eq', 'ADA')), (r, f) => (f === 'upper' ? r.name.toUpperCase() : undefined));
    expect(ids(out)).toEqual([1]);
  });
});

describe('compareValues', () => {
  it('compares numbers numerically, dates chronologically and puts empties last', () => {
    expect(compareValues('9', '10')).toBeLessThan(0);
    expect(compareValues('2024-01-02', '2024-01-10')).toBeLessThan(0);
    expect(compareValues(null, 'a')).toBeGreaterThan(0);
  });
});

describe('filtersToQuery', () => {
  it('emits an empty spec when nothing is active', () => {
    expect(filtersToQuery(group('and', cond('a', 'eq', '')))).toEqual({ params: {}, queryString: '' });
  });

  it('emits PostgREST and()/or() expressions', () => {
    const tree = group(
      'and',
      cond('status', 'eq', 'lead'),
      group('or', cond('amount', 'gt', 10), cond('name', 'contains', 'a b')),
      cond('city', 'isEmpty'),
      cond('status', 'in', 'x,y')
    );
    const { params, queryString } = filtersToQuery(tree);
    expect(params).toEqual({
      and: '(status.eq.lead,or(amount.gt.10,name.ilike."*a b*"),city.is.null,status.in.(x,y))',
    });
    expect(queryString).toBe(new URLSearchParams(params).toString());
  });

  it('maps field ids to db columns and uses the root op', () => {
    const { params } = filtersToQuery(group('or', cond('firstName', 'startsWith', 'A')), { firstName: 'first_name' });
    expect(params).toEqual({ or: '(first_name.ilike.A*)' });
  });
});
