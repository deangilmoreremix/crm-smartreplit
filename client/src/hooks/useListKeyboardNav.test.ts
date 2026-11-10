import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListKeyboardNav, isTypingTarget } from './useListKeyboardNav';

const items = [{ id: 'a' }, { id: 'b' }];
const press = (key: string, target: Element = document.body) =>
  act(() => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); });

describe('useListKeyboardNav', () => {
  it('moves, selects, opens, clears', () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() => useListKeyboardNav({ items, getId: (i) => i.id, onOpen }));
    press('j'); press('j'); press('j');
    expect(result.current.activeId).toBe('b');
    press('k');
    expect(result.current.activeId).toBe('a');
    press('x');
    expect(result.current.isSelected(items[0])).toBe(true);
    press('Enter');
    expect(onOpen).toHaveBeenCalledWith(items[0]);
    press('Escape');
    expect(result.current.selected.size).toBe(0);
    expect(result.current.activeIndex).toBe(-1);
  });
  it('ignores keys typed in inputs and editors', () => {
    const { result } = renderHook(() => useListKeyboardNav({ items, getId: (i) => i.id }));
    const input = document.body.appendChild(document.createElement('input'));
    const pm = document.body.appendChild(document.createElement('div'));
    pm.className = 'ProseMirror';
    press('j', input); press('j', pm);
    expect(result.current.activeIndex).toBe(-1);
    expect(isTypingTarget(pm)).toBe(true);
  });
  it('/ focuses search', () => {
    const onFocusSearch = vi.fn();
    renderHook(() => useListKeyboardNav({ items, getId: (i) => i.id, onFocusSearch }));
    press('/');
    expect(onFocusSearch).toHaveBeenCalled();
  });
});
