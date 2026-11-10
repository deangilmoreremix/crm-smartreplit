import { describe, it, expect } from 'vitest';
import { applyLayout, moveItem, toggleHidden } from './layout';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('record layout', () => {
  it('orders known ids first, appends unknown, and hides', () => {
    expect(applyLayout(items, { order: ['c', 'a'], hidden: [] }).map((i) => i.id)).toEqual(['c', 'a', 'b']);
    expect(applyLayout(items, { order: [], hidden: ['b'] }).map((i) => i.id)).toEqual(['a', 'c']);
    expect(applyLayout(items, { order: [], hidden: ['b'] }, true)).toHaveLength(3);
  });

  it('moves and toggles', () => {
    const l = moveItem({ order: [], hidden: [] }, ['a', 'b', 'c'], 'c', -1);
    expect(l.order).toEqual(['a', 'c', 'b']);
    expect(moveItem(l, ['a', 'b', 'c'], 'a', -1)).toBe(l);
    expect(toggleHidden(l, 'a').hidden).toEqual(['a']);
    expect(toggleHidden(toggleHidden(l, 'a'), 'a').hidden).toEqual([]);
  });
});
