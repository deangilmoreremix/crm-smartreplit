import React, { useState } from 'react';
import { useSavedViews, SavedView } from '../hooks/useSavedViews';

interface SavedViewsMenuProps<F extends Record<string, unknown>> {
  objectType: string;
  /** The filters currently applied; stored when the user saves a view. */
  currentFilters: F;
  onApply: (filters: F) => void;
  /** Table views: stored alongside the filters. */
  currentSort?: unknown;
  currentColumns?: unknown;
  viewType?: SavedView['view_type'];
  /** When given, applying a view passes the whole stored row (filters, sort, columns) instead of `onApply`. */
  onApplyView?: (view: SavedView<F>) => void;
}

function SavedViewsMenu<F extends Record<string, unknown>>({
  objectType,
  currentFilters,
  onApply,
  currentSort,
  currentColumns,
  viewType,
  onApplyView,
}: SavedViewsMenuProps<F>) {
  const { views, loading, error, saveView, updateView, deleteView } = useSavedViews<F>(objectType, viewType);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const saved = await saveView({
      name: trimmed,
      filters: currentFilters,
      view_type: viewType,
      sort: currentSort,
      columns: currentColumns,
    });
    if (saved) setName('');
  };

  const apply = (view: SavedView<F>) => {
    if (onApplyView) onApplyView(view);
    else onApply(view.filters);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
      >
        Saved views
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border bg-white p-3 shadow-lg space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : views.length === 0 ? (
            <div className="text-sm text-gray-500">No saved views yet.</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {views.map((view) => (
                <li key={view.id} className="flex items-center justify-between text-sm py-1">
                  <button type="button" onClick={() => apply(view)} className="text-left hover:underline truncate">
                    {view.name}
                  </button>
                  {onApplyView && (
                    <button
                      type="button"
                      aria-label={`Update view ${view.name} with current state`}
                      title="Overwrite with current state"
                      onClick={() =>
                        updateView(view.id, { filters: currentFilters, sort: currentSort, columns: currentColumns })
                      }
                      className="text-gray-400 hover:text-blue-600 ml-2 text-xs"
                    >
                      Update
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Delete view ${view.name}`}
                    onClick={() => deleteView(view.id)}
                    className="text-gray-400 hover:text-red-600 ml-2"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-1 border-t pt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Name current filters"
              aria-label="View name"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default SavedViewsMenu;
