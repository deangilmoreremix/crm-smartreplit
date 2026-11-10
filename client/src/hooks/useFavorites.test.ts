import { describe, it, expect, vi } from 'vitest';
vi.mock('../lib/supabase', () => ({ supabase: {} }));
import { orderFavorites, positionAt, type Favorite, type FavoriteFolder } from './useFavorites';

const fav = (id: string, folder: string | null, position: number): Favorite => ({
  id, object_type: 'contact', record_id: id, folder_id: folder, position,
});

describe('orderFavorites', () => {
  const folders: FavoriteFolder[] = [
    { id: 'b', name: 'B', position: 2 },
    { id: 'a', name: 'A', position: 1 },
  ];
  it('sorts folders and items, loose items last', () => {
    const g = orderFavorites([fav('1', 'a', 5), fav('2', 'a', 1), fav('3', null, 0), fav('4', 'gone', 2)], folders);
    expect(g.map((x) => x.folder?.id ?? null)).toEqual(['a', 'b', null]);
    expect(g[0].items.map((i) => i.id)).toEqual(['2', '1']);
    expect(g[2].items.map((i) => i.id)).toEqual(['3', '4']);
  });
});

describe('positionAt', () => {
  const items = [{ position: 1 }, { position: 3 }];
  it('handles empty, start, middle, end', () => {
    expect(positionAt([], 0)).toBe(1);
    expect(positionAt(items, 0)).toBe(0);
    expect(positionAt(items, 1)).toBe(2);
    expect(positionAt(items, 2)).toBe(4);
    expect(positionAt(items, Number.MAX_SAFE_INTEGER)).toBe(4);
  });
});

describe('shared favorites store', () => {
  it('fetches once for many consumers and shares state', async () => {
    const { renderHook, waitFor } = await import('@testing-library/react');
    const mod = await import('./useFavorites');
    const { supabase } = await import('../lib/supabase');
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn((_t: string) => ({ select }));
    (supabase as any).from = from;
    mod.resetFavoritesStore();
    const a = renderHook(() => mod.useFavorites());
    const b = renderHook(() => mod.useFavorites());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(from.mock.calls.filter(([t]) => t === 'favorites')).toHaveLength(1);
    expect(b.result.current.loading).toBe(false);
  });
});
