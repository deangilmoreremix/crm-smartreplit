import { useCallback, useEffect, useRef, useState } from 'react';

/** True when the event target is somewhere the user is typing (inputs, selects, contenteditable such as tiptap). */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return !!el.closest?.('[contenteditable="true"], .ProseMirror, [role="dialog"], [role="menu"], [role="listbox"]');
}

/** Focusable controls handle Enter themselves (click / start inline edit); the list must not also "open" the row. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el?.closest?.('button, a, [data-edit-cell]');
}

export interface ListKeyboardNavOptions<T> {
  items: T[];
  getId: (item: T) => string;
  onOpen?: (item: T) => void;
  /** Called when `x` toggles the focused row, so callers with their own selection state can mirror it. */
  onToggle?: (item: T) => void;
  /** Called when `/` is pressed; typically focuses the page search input. */
  onFocusSearch?: () => void;
  enabled?: boolean;
}

/** Bindings, exported so the shortcut help dialog can document them. */
export const LIST_NAV_BINDINGS = [
  { id: 'list-next', combo: 'j', description: 'Next row (or Down arrow)' },
  { id: 'list-prev', combo: 'k', description: 'Previous row (or Up arrow)' },
  { id: 'list-open', combo: 'Enter', description: 'Open focused row' },
  { id: 'list-select', combo: 'x', description: 'Toggle selection of focused row' },
  { id: 'list-search', combo: '/', description: 'Focus search' },
  { id: 'list-clear', combo: 'Esc', description: 'Clear selection / focus' },
] as const;

export function useListKeyboardNav<T>({
  items,
  getId,
  onOpen,
  onToggle,
  onFocusSearch,
  enabled = true,
}: ListKeyboardNavOptions<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ref = useRef({ items, getId, onOpen, onToggle, onFocusSearch, activeIndex });
  ref.current = { items, getId, onOpen, onToggle, onFocusSearch, activeIndex };

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(items.length - 1);
  }, [items.length, activeIndex]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const { items: list, getId: id, onOpen: open, onToggle: onTog, onFocusSearch: focus, activeIndex: idx } = ref.current;
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          if (!list.length) return;
          e.preventDefault();
          setActiveIndex(Math.min(idx + 1, list.length - 1));
          break;
        case 'k':
        case 'ArrowUp':
          if (!list.length) return;
          e.preventDefault();
          setActiveIndex(Math.max(idx - 1, 0));
          break;
        case 'Enter':
          if (idx >= 0 && list[idx] && open && !isInteractiveTarget(e.target)) {
            e.preventDefault();
            open(list[idx]);
          }
          break;
        case 'x':
          if (idx >= 0 && list[idx]) {
            e.preventDefault();
            toggle(id(list[idx]));
            onTog?.(list[idx]);
          }
          break;
        case '/':
          if (focus) {
            e.preventDefault();
            focus();
          }
          break;
        case 'Escape':
          setSelected(new Set());
          setActiveIndex(-1);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [enabled, toggle]);

  return {
    activeIndex,
    activeId: activeIndex >= 0 && items[activeIndex] ? getId(items[activeIndex]) : null,
    selected,
    isSelected: (item: T) => selected.has(getId(item)),
    toggle,
    clearSelection: () => setSelected(new Set()),
    setActiveIndex,
  };
}
