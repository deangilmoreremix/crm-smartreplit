import { describe, it, expect, vi } from 'vitest';
import { createRestAdapter, fillEmptyFields, runPerRow } from './bulkAdapter';
import { computeAggregate, groupRows } from './tableUtils';

const okFetch = (failIds: string[] = []) =>
  vi.fn(async (url: string, _init?: any) => ({
    ok: !failIds.some((id) => url.endsWith(`/${id}`)),
    status: 500,
    json: async () => ({}),
  }));

describe('createRestAdapter', () => {
  it('updates many rows and reports per-row failures', async () => {
    const f = okFetch(['2']);
    const a = createRestAdapter<{ id: number }>({ basePath: '/api/contacts', fetchImpl: f as any });
    const res = await a.updateMany([{ id: 1 }, { id: 2 }, { id: 3 }], { status: 'lead' });
    expect(res.succeeded).toBe(2);
    expect(res.errors).toEqual([{ id: '2', message: 'Request failed (500)' }]);
    expect(f).toHaveBeenCalledWith('/api/contacts/1', expect.objectContaining({ method: 'PUT', body: '{"status":"lead"}' }));
  });

  it('deletes, tags (union) and assigns owners', async () => {
    const f = okFetch();
    const a = createRestAdapter<{ id: number; tags?: string[] }>({
      basePath: '/api/x',
      tagsField: 'tags',
      ownerField: 'assignedTo',
      fetchImpl: f as any,
    });
    await a.deleteMany([{ id: 1 }]);
    expect(f.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    await a.addTag!([{ id: 1, tags: ['a'] }, { id: 2 }], 'a');
    expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({ tags: ['a'] });
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ tags: ['a'] });
    await a.assignOwner!([{ id: 1 }], 'u1');
    expect(JSON.parse(f.mock.calls[3][1].body)).toEqual({ assignedTo: 'u1' });
  });

  it('merges two records through the merge endpoint, filling only blanks', async () => {
    const f = okFetch();
    const a = createRestAdapter<{ id: number; phone?: string; company?: string }>({
      basePath: '/api/contacts',
      merge: { path: '/api/contacts/merge', fillKeys: ['phone', 'company'] },
      fetchImpl: f as any,
    });
    await a.merge!({ id: 1, company: 'Acme' }, { id: 2, phone: '555', company: 'Other' });
    expect(f.mock.calls[0][0]).toBe('/api/contacts/merge');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ primaryId: 1, duplicateId: 2, mergedFields: { phone: '555' } });
  });

  it('omits optional operations that are not configured', () => {
    const a = createRestAdapter<{ id: number }>({ basePath: '/api/x' });
    expect(a.addTag).toBeUndefined();
    expect(a.assignOwner).toBeUndefined();
    expect(a.merge).toBeUndefined();
  });
});

describe('helpers', () => {
  it('runPerRow bounds concurrency', async () => {
    let live = 0;
    let max = 0;
    await runPerRow(Array.from({ length: 12 }, (_, i) => ({ id: i })), (r) => String(r.id), async () => {
      live++;
      max = Math.max(max, live);
      await Promise.resolve();
      live--;
    }, 4);
    expect(max).toBeLessThanOrEqual(4);
  });

  it('fillEmptyFields prefers the primary', () => {
    expect(fillEmptyFields({ a: '', b: 'x' }, { a: 'y', b: 'z', c: 'w' }, ['a', 'b'])).toEqual({ a: 'y' });
  });

  it('aggregates and groups', () => {
    expect(computeAggregate([1, '2', null, 'x'], 'sum')).toBe(3);
    expect(computeAggregate([1, 2, 6], 'avg')).toBe(3);
    expect(computeAggregate([1, '', null, 0], 'count')).toBe(2);
    const col = { id: 's', header: 'S', accessor: (r: { s?: string }) => r.s };
    const groups = groupRows([{ s: 'a' }, { s: '' }, { s: 'a' }], col);
    expect(groups.map((g) => [g.label, g.rows.length])).toEqual([['a', 2], ['(empty)', 1]]);
  });
});
