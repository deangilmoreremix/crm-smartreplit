import React from 'react';

export interface LayoutPref {
  order: string[];
  hidden: string[];
}

export const emptyLayout: LayoutPref = { order: [], hidden: [] };

/** Orders items by `layout.order` (unknown ids keep their natural order at the end) and drops hidden ones. */
export function applyLayout<T extends { id: string }>(items: T[], layout: LayoutPref, includeHidden = false): T[] {
  const pos = new Map(layout.order.map((id, i) => [id, i]));
  const sorted = [...items].sort((a, b) => (pos.get(a.id) ?? Infinity) - (pos.get(b.id) ?? Infinity));
  return includeHidden ? sorted : sorted.filter((i) => !layout.hidden.includes(i.id));
}

export function moveItem(layout: LayoutPref, ids: string[], id: string, dir: -1 | 1): LayoutPref {
  const order = applyLayout(ids.map((i) => ({ id: i })), layout, true).map((i) => i.id);
  const i = order.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return layout;
  [order[i], order[j]] = [order[j], order[i]];
  return { ...layout, order };
}

export function toggleHidden(layout: LayoutPref, id: string): LayoutPref {
  return {
    ...layout,
    hidden: layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id],
  };
}

interface CustomizerProps {
  title: string;
  items: { id: string; label: string }[];
  layout: LayoutPref;
  onChange: (next: LayoutPref) => void;
}

/** Reorder / show-hide list used to configure a record page's fields or widgets. */
export const LayoutCustomizer: React.FC<CustomizerProps> = ({ title, items, layout, onChange }) => {
  const ids = items.map((i) => i.id);
  const ordered = applyLayout(items, layout, true);
  return (
    <fieldset className="border rounded p-3 text-sm">
      <legend className="px-1 text-gray-500">{title}</legend>
      {ordered.map((item) => (
        <div key={item.id} className="flex items-center gap-2 py-0.5">
          <label className="flex items-center gap-2 flex-1">
            <input type="checkbox" checked={!layout.hidden.includes(item.id)} onChange={() => onChange(toggleHidden(layout, item.id))} />
            {item.label}
          </label>
          <button type="button" aria-label={`Move ${item.label} up`} onClick={() => onChange(moveItem(layout, ids, item.id, -1))}>↑</button>
          <button type="button" aria-label={`Move ${item.label} down`} onClick={() => onChange(moveItem(layout, ids, item.id, 1))}>↓</button>
        </div>
      ))}
      <button type="button" className="mt-1 text-xs text-blue-600" onClick={() => onChange(emptyLayout)}>
        Reset
      </button>
    </fieldset>
  );
};
