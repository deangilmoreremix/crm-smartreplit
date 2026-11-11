import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LAYOUT_STORAGE_KEY,
  LEGACY_ORDER_KEY,
  createDefaultLayoutState,
  fetchRemoteLayout,
  getVisibleSections,
  isMissingTableError,
  layoutReducer,
  loadLocalLayoutState,
  migrateLayoutState,
  pickNewer,
  pushRemoteLayout,
} from '../useDashboardLayoutStore';

const DEFAULT = ['a', 'b', 'c', 'automations-section', 'quick-actions-section'];

function memStorage(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('layout migration', () => {
  it('uses defaults and hides unified-activity when nothing is stored', () => {
    const s = loadLocalLayoutState(DEFAULT, memStorage());
    expect(s.sectionOrder.slice(0, DEFAULT.length)).toEqual(DEFAULT);
    expect(s.hiddenSections).toEqual(['unified-activity']);
    expect(getVisibleSections(s)).toEqual(DEFAULT);
    expect(s.updatedAt).toBe(0);
  });

  it('turns the legacy order into the initial layout (once) and keeps it', () => {
    const st = memStorage({ [LEGACY_ORDER_KEY]: JSON.stringify(['c', 'a', 'automations-section', 'quick-actions-section']) });
    const s = loadLocalLayoutState(DEFAULT, st);
    expect(getVisibleSections(s)).toEqual(['c', 'a', 'automations-section', 'quick-actions-section']);
    expect(s.hiddenSections).toContain('unified-activity');
    expect(s.updatedAt).toBeGreaterThan(0);
  });

  it('applies the legacy automations/quick-actions insertion migration', () => {
    const st = memStorage({ [LEGACY_ORDER_KEY]: JSON.stringify(['executive-overview-section', 'x']) });
    const s = loadLocalLayoutState(DEFAULT, st);
    expect(s.sectionOrder.slice(0, 3)).toEqual([
      'executive-overview-section',
      'automations-section',
      'quick-actions-section',
    ]);
  });

  it('prefers the v2 layout over the legacy key', () => {
    const v2 = { ...createDefaultLayoutState(DEFAULT), sectionOrder: ['z'], updatedAt: 5 };
    const st = memStorage({
      [LAYOUT_STORAGE_KEY]: JSON.stringify(v2),
      [LEGACY_ORDER_KEY]: JSON.stringify(['q']),
    });
    const order = loadLocalLayoutState(DEFAULT, st).sectionOrder;
    expect(order[0]).toBe('z');
    expect(order).not.toContain('q');
  });

  it('appends default sections missing from a saved v2 layout, once, and persists', () => {
    const saved = { ...createDefaultLayoutState(['a', 'b']), sectionOrder: ['b', 'a'], hiddenSections: [], updatedAt: 5 };
    const st = memStorage({ [LAYOUT_STORAGE_KEY]: JSON.stringify(saved) });
    const s = loadLocalLayoutState(['a', 'b', 'new-section', 'unified-activity'], st);
    expect(s.sectionOrder).toEqual(['b', 'a', 'new-section', 'unified-activity']);
    expect(s.hiddenSections).toEqual(['unified-activity']); // hidden-by-default stays hidden
    expect(getVisibleSections(s)).toContain('new-section');
    expect(s.updatedAt).toBeGreaterThan(5);
    const persisted = JSON.parse(st.getItem(LAYOUT_STORAGE_KEY)!);
    expect(persisted.sectionOrder).toContain('new-section');

    // second load: nothing to migrate, updatedAt unchanged
    const again = loadLocalLayoutState(['a', 'b', 'new-section', 'unified-activity'], st);
    expect(again.updatedAt).toBe(s.updatedAt);
    expect(again.sectionOrder).toEqual(s.sectionOrder);
  });

  it('does not re-show a section the user hid after it was migrated', () => {
    const st = memStorage({
      [LAYOUT_STORAGE_KEY]: JSON.stringify({
        ...createDefaultLayoutState(['a', 'b']),
        sectionOrder: ['a', 'b'],
        hiddenSections: ['b'],
        updatedAt: 5,
      }),
    });
    const s = loadLocalLayoutState(['a', 'b'], st);
    expect(s.hiddenSections).toEqual(['b']);
    expect(s.updatedAt).toBe(5);
  });

  it('falls back to defaults on corrupt storage', () => {
    const st = memStorage({ [LAYOUT_STORAGE_KEY]: '{oops', [LEGACY_ORDER_KEY]: '[[' });
    expect(loadLocalLayoutState(DEFAULT, st).sectionOrder.slice(0, 3)).toEqual(['a', 'b', 'c']);
  });

  it('rejects invalid remote values and repairs sizes', () => {
    expect(migrateLayoutState({ sectionOrder: [] }, DEFAULT)).toBeNull();
    const s = migrateLayoutState(
      { version: 2, sectionOrder: ['a'], sectionSizes: { a: 'wide', b: 'huge' } },
      DEFAULT
    )!;
    expect(s.sectionSizes).toEqual({ a: 'wide' });
  });

  it('last-write-wins by updatedAt', () => {
    const l = { updatedAt: 10 };
    expect(pickNewer(l, { updatedAt: 20 }).updatedAt).toBe(20);
    expect(pickNewer(l, { updatedAt: 5 }).updatedAt).toBe(10);
    expect(pickNewer(l, null)).toBe(l);
  });
});

describe('layoutReducer', () => {
  const base = createDefaultLayoutState(DEFAULT);

  it('toggles visibility and re-adds removed sections to the order', () => {
    let s = layoutReducer(base, { type: 'toggle', id: 'a', now: 1 });
    expect(s.hiddenSections).toContain('a');
    expect(getVisibleSections(s)).not.toContain('a');
    s = layoutReducer(s, { type: 'toggle', id: 'a', now: 2 });
    expect(getVisibleSections(s)).toContain('a');
    s = layoutReducer({ ...s, sectionOrder: ['b'] }, { type: 'toggle', id: 'new', now: 3 });
    expect(s.sectionOrder).toEqual(['b', 'new']);
    expect(s.updatedAt).toBe(3);
  });

  it('saves, applies, renames, defaults and deletes named layouts', () => {
    let s = layoutReducer(base, { type: 'setOrder', order: ['c', 'b', 'a'], now: 1 });
    s = layoutReducer(s, { type: 'setSize', id: 'c', size: 'wide', now: 2 });
    s = layoutReducer(s, { type: 'saveAs', name: ' Sales ', layoutId: 'L1', now: 3 });
    expect(s.savedLayouts).toHaveLength(1);
    expect(s.savedLayouts[0]).toMatchObject({ id: 'L1', name: 'Sales', sectionOrder: ['c', 'b', 'a'] });

    s = layoutReducer(s, { type: 'setOrder', order: ['a'], now: 4 });
    s = layoutReducer(s, { type: 'apply', layoutId: 'L1', now: 5 });
    expect(s.sectionOrder).toEqual(['c', 'b', 'a']);
    expect(s.sectionSizes.c).toBe('wide');

    s = layoutReducer(s, { type: 'rename', layoutId: 'L1', name: 'Pipeline', now: 6 });
    expect(s.savedLayouts[0].name).toBe('Pipeline');

    s = layoutReducer(s, { type: 'setDefault', layoutId: 'L1', now: 7 });
    s = layoutReducer(s, { type: 'setOrder', order: ['x'], now: 8 });
    s = layoutReducer(s, { type: 'reset', defaultOrder: DEFAULT, now: 9 });
    expect(s.sectionOrder).toEqual(['c', 'b', 'a']); // reset goes to the default saved layout

    s = layoutReducer(s, { type: 'delete', layoutId: 'L1', now: 10 });
    expect(s.savedLayouts).toHaveLength(0);
    expect(s.defaultLayoutId).toBeNull();
    s = layoutReducer(s, { type: 'reset', defaultOrder: DEFAULT, now: 11 });
    expect(s.sectionOrder.slice(0, 3)).toEqual(['a', 'b', 'c']);
  });

  it('resetBuiltIn ignores the default saved layout, keeps saved layouts, optionally clears widget settings', () => {
    let s = layoutReducer(base, { type: 'setOrder', order: ['c', 'b', 'a'], now: 1 });
    s = layoutReducer(s, { type: 'saveAs', name: 'Mine', layoutId: 'L1', now: 2 });
    s = layoutReducer(s, { type: 'setDefault', layoutId: 'L1', now: 3 });
    s = layoutReducer(s, { type: 'widgetSettings', id: 'w', patch: { rangeDays: 7 }, now: 4 });
    s = layoutReducer(s, { type: 'setSize', id: 'a', size: 'wide', now: 5 });

    const kept = layoutReducer(s, { type: 'resetBuiltIn', defaultOrder: DEFAULT, now: 6 });
    expect(kept.sectionOrder.slice(0, 3)).toEqual(['a', 'b', 'c']);
    expect(kept.sectionSizes).toEqual({});
    expect(kept.savedLayouts).toHaveLength(1);
    expect(kept.widgetSettings.w).toEqual({ rangeDays: 7 });
    expect(kept.hiddenSections).toEqual(['unified-activity']);

    const cleared = layoutReducer(s, { type: 'resetBuiltIn', defaultOrder: DEFAULT, clearWidgetSettings: true, now: 7 });
    expect(cleared.widgetSettings).toEqual({});

    // legacy reset still applies the user's default layout
    expect(layoutReducer(s, { type: 'reset', defaultOrder: DEFAULT, now: 8 }).sectionOrder).toEqual(['c', 'b', 'a']);
  });

  it('same-name save overwrites, empty name is ignored, widget settings merge', () => {
    let s = layoutReducer(base, { type: 'saveAs', name: 'X', layoutId: '1', now: 1 });
    s = layoutReducer(s, { type: 'saveAs', name: 'x', layoutId: '2', now: 2 });
    expect(s.savedLayouts).toHaveLength(1);
    expect(s.savedLayouts[0].id).toBe('1');
    expect(layoutReducer(s, { type: 'saveAs', name: '  ', layoutId: '3' })).toBe(s);
    s = layoutReducer(s, { type: 'widgetSettings', id: 'w', patch: { rangeDays: 7 }, now: 3 });
    s = layoutReducer(s, { type: 'widgetSettings', id: 'w', patch: { metric: 'm' }, now: 4 });
    expect(s.widgetSettings.w).toEqual({ rangeDays: 7, metric: 'm' });
  });
});

describe('supabase access (missing table)', () => {
  beforeEach(() => vi.restoreAllMocks());

  const clientWith = (result: any) => ({
    from: () => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => result,
        upsert: async () => result,
      };
      return chain;
    },
  });

  it('detects missing table errors', () => {
    expect(isMissingTableError({ code: '42P01' })).toBe(true);
    expect(isMissingTableError({ code: 'PGRST205', message: 'x' })).toBe(true);
    expect(isMissingTableError({ message: 'relation "x" does not exist' })).toBe(true);
    expect(isMissingTableError({ code: '42501', message: 'denied' })).toBe(false);
  });

  it('reports missingTable on fetch and push instead of throwing', async () => {
    const err = { data: null, error: { code: 'PGRST205', message: 'Could not find the table' } };
    expect(await fetchRemoteLayout(clientWith(err), 'u', DEFAULT)).toEqual({ ok: false, missingTable: true });
    expect(await pushRemoteLayout(clientWith(err), 'u', createDefaultLayoutState(DEFAULT))).toEqual({
      ok: false,
      missingTable: true,
    });
  });

  it('returns the remote layout when present', async () => {
    const value = { ...createDefaultLayoutState(DEFAULT), updatedAt: 42 };
    const res = await fetchRemoteLayout(clientWith({ data: { value, updated_at: null }, error: null }), 'u', DEFAULT);
    expect(res.ok && res.value?.updatedAt).toBe(42);
  });
});
