import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SavedViewConfig,
  ViewType,
  ColumnConfig,
  ViewFilter,
  ViewSort,
  KanbanColumnConfig,
} from './saved-views';

const STORAGE_KEY = 'smartcrm_saved_views';

const DEFAULT_VIEWS: SavedViewConfig[] = [
  {
    id: 'default-table',
    name: 'All Contacts',
    viewType: 'table',
    filters: [],
    sortOrder: [{ field: 'createdAt', direction: 'desc' }],
    columns: [],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-kanban',
    name: 'Pipeline',
    viewType: 'kanban',
    filters: [],
    sortOrder: [],
    columns: [],
    kanbanColumns: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface UseSavedViewsOptions {
  tenantId?: string;
  userId?: string;
  supabase?: any;
  storageKey?: string;
}

interface UseSavedViewsReturn {
  views: SavedViewConfig[];
  activeView: SavedViewConfig | null;
  setActiveView: (viewId: string) => void;
  createView: (view: Omit<SavedViewConfig, 'id' | 'createdAt' | 'updatedAt'>) => SavedViewConfig;
  updateView: (viewId: string, updates: Partial<SavedViewConfig>) => void;
  deleteView: (viewId: string) => void;
  duplicateView: (viewId: string) => SavedViewConfig | null;
  setDefaultView: (viewId: string) => void;
  saveView: (view: SavedViewConfig) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
  error: Error | null;
}

export function useSavedViews(options: UseSavedViewsOptions = {}): UseSavedViewsReturn {
  const { supabase, storageKey = STORAGE_KEY } = options;

  const [views, setViews] = useState<SavedViewConfig[]>(DEFAULT_VIEWS);
  const [activeViewId, setActiveViewId] = useState<string | null>('default-table');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadViews = async () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setViews(parsed);
          if (parsed.length > 0 && !activeViewId) {
            const defaultView = parsed.find((v: SavedViewConfig) => v.isDefault);
            setActiveViewId(defaultView?.id || parsed[0].id);
          }
        }

        if (supabase) {
          const { data, error } = await supabase
            .from('saved_views')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const syncedViews = data.map((row: any) => ({
              id: row.id,
              name: row.name,
              viewType: row.view_type as ViewType,
              filters: row.filters || [],
              sortOrder: row.sort_order || [],
              columns: row.columns || [],
              kanbanColumns: row.kanban_columns || [],
              isDefault: row.is_default || false,
              isShared: row.is_shared || false,
              createdBy: row.created_by,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));
            if (syncedViews.length > 0) {
              setViews(syncedViews);
              localStorage.setItem(storageKey, JSON.stringify(syncedViews));
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load views'));
      } finally {
        setIsLoading(false);
      }
    };

    loadViews();
  }, [supabase, storageKey]);

  const persistViews = useCallback(
    (updatedViews: SavedViewConfig[]) => {
      localStorage.setItem(storageKey, JSON.stringify(updatedViews));
      setViews(updatedViews);
    },
    [storageKey]
  );

  const setActiveView = useCallback((viewId: string) => {
    setActiveViewId(viewId);
  }, []);

  const activeView = useMemo(() => {
    return views.find((v) => v.id === activeViewId) || views[0] || null;
  }, [views, activeViewId]);

  const createView = useCallback(
    (viewData: Omit<SavedViewConfig, 'id' | 'createdAt' | 'updatedAt'>): SavedViewConfig => {
      const now = new Date().toISOString();
      const newView: SavedViewConfig = {
        ...viewData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      const updatedViews = [...views, newView];
      persistViews(updatedViews);
      return newView;
    },
    [views, persistViews]
  );

  const updateView = useCallback(
    (viewId: string, updates: Partial<SavedViewConfig>) => {
      const updatedViews = views.map((v) =>
        v.id === viewId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      persistViews(updatedViews);
    },
    [views, persistViews]
  );

  const deleteView = useCallback(
    (viewId: string) => {
      if (viewId.startsWith('default-')) return;
      const updatedViews = views.filter((v) => v.id !== viewId);
      if (activeViewId === viewId) {
        setActiveViewId(updatedViews[0]?.id || null);
      }
      persistViews(updatedViews);
    },
    [views, activeViewId, persistViews]
  );

  const duplicateView = useCallback(
    (viewId: string): SavedViewConfig | null => {
      const source = views.find((v) => v.id === viewId);
      if (!source) return null;
      return createView({
        ...source,
        name: `${source.name} (Copy)`,
        isDefault: false,
      });
    },
    [views, createView]
  );

  const setDefaultView = useCallback(
    (viewId: string) => {
      const updatedViews = views.map((v) => ({
        ...v,
        isDefault: v.id === viewId,
      }));
      persistViews(updatedViews);
    },
    [views, persistViews]
  );

  const saveView = useCallback(
    (view: SavedViewConfig) => {
      const updatedViews = views.map((v) =>
        v.id === view.id ? { ...view, updatedAt: new Date().toISOString() } : v
      );
      if (!updatedViews.find((v) => v.id === view.id)) {
        updatedViews.push(view);
      }
      persistViews(updatedViews);
    },
    [views, persistViews]
  );

  const resetToDefaults = useCallback(() => {
    persistViews(DEFAULT_VIEWS);
    setActiveViewId('default-table');
  }, [persistViews]);

  return {
    views,
    activeView,
    setActiveView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefaultView,
    saveView,
    resetToDefaults,
    isLoading,
    error,
  };
}

export function applyFilters<T extends Record<string, any>>(data: T[], filters: ViewFilter[]): T[] {
  if (!filters || filters.length === 0) return data;

  return data.filter((item) => {
    return filters.every((filter) => {
      const value = item[filter.field];

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'not_equals':
          return value !== filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'not_contains':
          return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        case 'between':
          const [min, max] = filter.value;
          return Number(value) >= min && Number(value) <= max;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'not_in':
          return Array.isArray(filter.value) && !filter.value.includes(value);
        case 'is_empty':
          return value === null || value === undefined || value === '';
        case 'is_not_empty':
          return value !== null && value !== undefined && value !== '';
        default:
          return true;
      }
    });
  });
}

export function applySort<T extends Record<string, any>>(data: T[], sortOrder: ViewSort[]): T[] {
  if (!sortOrder || sortOrder.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sortOrder) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (aVal === bVal) continue;

      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
}
