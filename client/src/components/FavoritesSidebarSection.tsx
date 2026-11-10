import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { FolderPlus, Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useFavorites, type Favorite } from '../hooks/useFavorites';
import { recordPath } from '../hooks/useGlobalSearch';

const SOURCES: Record<string, { table: string; label: (r: any) => string }> = {
  contact: { table: 'contacts', label: (r) => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() },
  deal: { table: 'deals', label: (r) => r.title },
  task: { table: 'tasks', label: (r) => r.title },
  company: { table: 'companies', label: (r) => r.name },
};

const ROOT = 'root';

/** Resolve display titles for favorites ("type:id" -> label). */
function useLabels(favorites: Favorite[]) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const key = favorites.map((f) => `${f.object_type}:${f.record_id}`).sort().join('|');
  useEffect(() => {
    let cancelled = false;
    const byType = new Map<string, string[]>();
    favorites.forEach((f) => byType.set(f.object_type, [...(byType.get(f.object_type) ?? []), f.record_id]));
    byType.forEach(async (ids, type) => {
      const src = SOURCES[type];
      if (!src) return;
      try {
        const { data } = await supabase.from(src.table).select('*').in('id', ids);
        if (cancelled || !data) return;
        setLabels((prev) => {
          const next = { ...prev };
          (data as any[]).forEach((r) => (next[`${type}:${r.id}`] = src.label(r)));
          return next;
        });
      } catch {
        /* label stays as fallback */
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return labels;
}

export const FavoritesSidebarSection: React.FC = () => {
  const { groups, favorites, moveFavorite, removeFavorite, createFolder, renameFolder, deleteFolder } = useFavorites();
  const labels = useLabels(favorites);

  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return;
    const folderId = r.destination.droppableId === ROOT ? null : r.destination.droppableId;
    void moveFavorite(r.draggableId, folderId, r.destination.index);
  };

  const addFolder = () => {
    const name = window.prompt('Folder name');
    if (name?.trim()) void createFolder(name.trim());
  };

  return (
    <div className="px-2 py-2" aria-label="Favorites">
      <div className="flex items-center justify-between px-2 pb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" /> Favorites
        </span>
        <button type="button" onClick={addFolder} aria-label="New folder" title="New folder">
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        {groups.map(({ folder, items }) => (
          <div key={folder?.id ?? ROOT} className="mb-1">
            {folder && (
              <div className="group flex items-center justify-between px-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <button
                  type="button"
                  onDoubleClick={() => {
                    const n = window.prompt('Rename folder', folder.name);
                    if (n?.trim()) void renameFolder(folder.id, n.trim());
                  }}
                  title="Double-click to rename"
                >
                  {folder.name}
                </button>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100"
                  aria-label={`Delete folder ${folder.name}`}
                  onClick={() => void deleteFolder(folder.id)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Droppable droppableId={folder?.id ?? ROOT}>
              {(drop) => (
                <ul ref={drop.innerRef} {...drop.droppableProps} className="min-h-[4px]">
                  {items.map((f, i) => (
                    <Draggable key={f.id} draggableId={f.id} index={i}>
                      {(drag) => (
                        <li
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className="group flex items-center justify-between rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Link to={recordPath(f.object_type, f.record_id)} className="truncate">
                            {labels[`${f.object_type}:${f.record_id}`] ?? `${f.object_type} #${f.record_id}`}
                          </Link>
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100"
                            aria-label="Remove favorite"
                            onClick={() => void removeFavorite(f.object_type, f.record_id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {drop.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};

export default FavoritesSidebarSection;
