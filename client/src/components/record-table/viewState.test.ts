import { describe, it, expect } from 'vitest';
import { defaultViewState, deserializeView, serializeView, legacyFiltersToTree } from './viewState';

describe('view serialization', () => {
  it('round-trips sort, columns (order/visibility/width), groupBy and filters', () => {
    const state = {
      ...defaultViewState(),
      sorting: [{ id: 'name', desc: true }, { id: 'status', desc: false }],
      filters: { type: 'group' as const, op: 'or' as const, children: [{ type: 'condition' as const, field: 'status', operator: 'eq' as const, value: 'lead' }] },
      groupBy: 'status',
      columnOrder: ['status', 'name'],
      columnVisibility: { phone: false },
      columnSizing: { name: 240 },
    };
    const stored = JSON.parse(JSON.stringify(serializeView(state)));
    expect(stored.columns.version).toBe(1);
    const restored = deserializeView(stored);
    expect(restored).toMatchObject({
      sorting: state.sorting,
      filters: state.filters,
      groupBy: 'status',
      columnOrder: ['status', 'name'],
      columnVisibility: { phone: false },
      columnSizing: { name: 240 },
    });
  });

  it('converts legacy flat filters and ignores the legacy empty columns array', () => {
    const restored = deserializeView({ filters: { search: 'ada', status: 'customer', industry: '' }, sort: [], columns: [] });
    expect(restored.search).toBe('ada');
    expect(restored.filters).toEqual({ type: 'group', op: 'and', children: [{ type: 'condition', field: 'status', operator: 'eq', value: 'customer' }] });
    expect(restored.columnOrder).toBeUndefined();
    expect(legacyFiltersToTree({}).tree.children).toEqual([]);
  });

  it('tolerates garbage', () => {
    const r = deserializeView({ filters: null, sort: 'x', columns: 5 });
    expect(r.sorting).toEqual([]);
    expect(r.filters).toEqual({ type: 'group', op: 'and', children: [] });
  });
});
