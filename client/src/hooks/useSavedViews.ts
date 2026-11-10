import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SavedView<F = Record<string, unknown>> {
  id: string;
  user_id: string;
  object_type: string;
  name: string;
  view_type: 'table' | 'kanban' | 'calendar';
  filters: F;
  sort: unknown;
  columns: unknown;
  is_default: boolean;
}

export interface SavedViewInput<F = Record<string, unknown>> {
  name: string;
  view_type?: SavedView['view_type'];
  filters: F;
  sort?: unknown;
  columns?: unknown;
  is_default?: boolean;
}

/** CRUD over the Supabase `views` table (RLS limits rows to the signed-in user). */
export function useSavedViews<F = Record<string, unknown>>(objectType: string) {
  const [views, setViews] = useState<SavedView<F>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('views')
      .select('*')
      .eq('object_type', objectType)
      .order('name');
    if (err) setError(err.message);
    else setViews((data ?? []) as SavedView<F>[]);
    setLoading(false);
  }, [objectType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveView = useCallback(
    async (input: SavedViewInput<F>): Promise<SavedView<F> | null> => {
      setError(null);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setError('Sign in to save views');
        return null;
      }
      const { data, error: err } = await supabase
        .from('views')
        .insert({
          user_id: auth.user.id,
          object_type: objectType,
          name: input.name,
          view_type: input.view_type ?? 'table',
          filters: input.filters,
          sort: input.sort ?? [],
          columns: input.columns ?? [],
          is_default: input.is_default ?? false,
        })
        .select()
        .single();
      if (err) {
        setError(err.message);
        return null;
      }
      const saved = data as SavedView<F>;
      setViews((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      return saved;
    },
    [objectType]
  );

  const deleteView = useCallback(async (id: string) => {
    setError(null);
    const { error: err } = await supabase.from('views').delete().eq('id', id);
    if (err) setError(err.message);
    else setViews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { views, loading, error, saveView, deleteView, refresh };
}
