import { describe, it, expect } from 'vitest';
import { emptySelection, pruneSelection, toggleAll, toggleRow } from './selection';

const ids = ['a', 'b', 'c', 'd', 'e'];

describe('selection', () => {
  it('toggles single rows and tracks the anchor', () => {
    let s = toggleRow(emptySelection(), ids, 'b', false);
    expect([...s.selected]).toEqual(['b']);
    expect(s.anchor).toBe('b');
    s = toggleRow(s, ids, 'b', false);
    expect(s.selected.size).toBe(0);
  });

  it('shift-click selects the range from the anchor in either direction', () => {
    let s = toggleRow(emptySelection(), ids, 'b', false);
    s = toggleRow(s, ids, 'd', true);
    expect([...s.selected].sort()).toEqual(['b', 'c', 'd']);
    s = toggleRow(emptySelection(), ids, 'd', false);
    s = toggleRow(s, ids, 'b', true);
    expect([...s.selected].sort()).toEqual(['b', 'c', 'd']);
  });

  it('shift-click on a selected row deselects the range', () => {
    let s = toggleAll(emptySelection(), ids);
    s = { ...s, anchor: 'a' };
    s = toggleRow(s, ids, 'c', true);
    expect([...s.selected].sort()).toEqual(['d', 'e']);
  });

  it('toggleAll selects then clears; prune drops vanished ids', () => {
    let s = toggleAll(emptySelection(), ids);
    expect(s.selected.size).toBe(5);
    s = pruneSelection(s, new Set(['a', 'b']));
    expect([...s.selected].sort()).toEqual(['a', 'b']);
    expect(toggleAll(toggleAll(emptySelection(), ids), ids).selected.size).toBe(0);
  });
});
