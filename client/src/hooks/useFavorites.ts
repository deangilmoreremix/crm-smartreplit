import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Favorite {
  id: string;
  object_type: string;
  record_id: string;
  folder_id: string | null;
  position: number;
  created_at?: string;
  label?: string;
}

export interface FavoriteFolder {
  id: string;
  name: string;
  position: number;
}

export interface FavoriteGroup {
  folder: FavoriteFolder | null;
  items: Favorite[];
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** Folders (sorted) first, each with its sorted items; ungrouped favorites come last with folder = null. */
export function orderFavorites(favorites: Favorite[], folders: FavoriteFolder[]): FavoriteGroup[] {
  const sortedFolders = [...folders].sort(byPosition);
  const known = new Set(sortedFolders.map((f) => f.id));
  const groups: FavoriteGroup[] = sortedFolders.map((folder) => ({
    folder,
    items: favorites.filter((f) => f.folder_id === folder.id).sort(byPosition),
  }));
  const loose = favorites.filter((f) => !f.folder_id || !known.has(f.folder_id)).sort(byPosition);
  groups.push({ folder: null, items: loose });
  return groups;
}

/** Fractional position that lands at `index` among `items` (already sorted, excluding the moved item). */
export function positionAt(items: Array<{ position: number }>, index: number): number {
  if (items.length === 0) return 1;
  if (index <= 0) return items[0].position - 1;
  if (index >= items.length) return items[items.length - 1].position + 1;
  return (items[index - 1].position + items[index].position) / 2;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([
        supabase.from('favorites').select('*').order('position'),
        supabase.from('favorite_folders').select('*').order('position'),
      ]);
      setFavorites(((f.data as Favorite[]) || []).map((x) => ({ ...x, position: Number(x.position) })));
      setFolders(((d.data as FavoriteFolder[]) || []).map((x) => ({ ...x, position: Number(x.position) })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isFavorite = useCallback(
    (objectType: string, recordId: string) =>
      favorites.some((f) => f.object_type === objectType && f.record_id === String(recordId)),
    [favorites]
  );

  const addFavorite = useCallback(
    async (objectType: string, recordId: string, folderId: string | null = null) => {
      const position = positionAt(
        favorites.filter((f) => f.folder_id === folderId).sort(byPosition),
        Number.MAX_SAFE_INTEGER
      );
      const { data } = await supabase
        .from('favorites')
        .upsert(
          { object_type: objectType, record_id: String(recordId), folder_id: folderId, position },
          { onConflict: 'user_id,object_type,record_id', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle();
      await load();
      return data as Favorite | null;
    },
    [favorites, load]
  );

  const removeFavorite = useCallback(
    async (objectType: string, recordId: string) => {
      setFavorites((prev) =>
        prev.filter((f) => !(f.object_type === objectType && f.record_id === String(recordId)))
      );
      await supabase
        .from('favorites')
        .delete()
        .eq('object_type', objectType)
        .eq('record_id', String(recordId));
    },
    []
  );

  const toggleFavorite = useCallback(
    async (objectType: string, recordId: string) => {
      if (isFavorite(objectType, recordId)) await removeFavorite(objectType, recordId);
      else await addFavorite(objectType, recordId);
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  /** Move a favorite to `index` within `folderId` (null = ungrouped). Optimistic. */
  const moveFavorite = useCallback(
    async (favoriteId: string, folderId: string | null, index: number) => {
      const target = favorites
        .filter((f) => f.id !== favoriteId && (f.folder_id ?? null) === folderId)
        .sort(byPosition);
      const position = positionAt(target, index);
      setFavorites((prev) =>
        prev.map((f) => (f.id === favoriteId ? { ...f, folder_id: folderId, position } : f))
      );
      await supabase.from('favorites').update({ folder_id: folderId, position }).eq('id', favoriteId);
    },
    [favorites]
  );

  const createFolder = useCallback(
    async (name: string) => {
      const position = positionAt([...folders].sort(byPosition), Number.MAX_SAFE_INTEGER);
      await supabase.from('favorite_folders').insert({ name, position });
      await load();
    },
    [folders, load]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      await supabase.from('favorite_folders').update({ name }).eq('id', id);
    },
    []
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await supabase.from('favorite_folders').delete().eq('id', id);
      await load();
    },
    [load]
  );

  return {
    favorites,
    folders,
    groups: orderFavorites(favorites, folders),
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    moveFavorite,
    createFolder,
    renameFolder,
    deleteFolder,
    reload: load,
  };
}
