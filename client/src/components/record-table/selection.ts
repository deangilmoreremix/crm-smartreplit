export interface SelectionState {
  selected: Set<string>;
  /** Last row toggled without shift; the origin of shift-click ranges. */
  anchor: string | null;
}

export const emptySelection = (): SelectionState => ({ selected: new Set(), anchor: null });

/** Toggles `id`; with `shift` selects the range between the anchor and `id` (in `orderedIds` order). */
export function toggleRow(
  state: SelectionState,
  orderedIds: string[],
  id: string,
  shift: boolean
): SelectionState {
  const selected = new Set(state.selected);
  const anchorIdx = state.anchor === null ? -1 : orderedIds.indexOf(state.anchor);
  const idx = orderedIds.indexOf(id);
  if (shift && anchorIdx >= 0 && idx >= 0) {
    const [from, to] = anchorIdx < idx ? [anchorIdx, idx] : [idx, anchorIdx];
    const adding = !state.selected.has(id);
    for (let i = from; i <= to; i++) {
      if (adding) selected.add(orderedIds[i]);
      else selected.delete(orderedIds[i]);
    }
    return { selected, anchor: id };
  }
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  return { selected, anchor: id };
}

/** Select every id, or clear them all when every id is already selected. */
export function toggleAll(state: SelectionState, ids: string[]): SelectionState {
  const all = ids.length > 0 && ids.every((i) => state.selected.has(i));
  return { selected: all ? new Set() : new Set(ids), anchor: null };
}

/** Drops selected ids that no longer exist (after filtering or deleting). */
export function pruneSelection(state: SelectionState, existing: Set<string>): SelectionState {
  const selected = new Set([...state.selected].filter((i) => existing.has(i)));
  return selected.size === state.selected.size ? state : { selected, anchor: state.anchor && existing.has(state.anchor) ? state.anchor : null };
}
