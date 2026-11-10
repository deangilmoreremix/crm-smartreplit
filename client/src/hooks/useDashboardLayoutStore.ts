import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Dashboard layout store.
 * - Layout is a config object (order, hidden sections, sizes, widget settings, saved layouts).
 * - Cached in localStorage (offline / first paint), synced to Supabase `user_ui_preferences`
 *   (kind 'dashboard', key 'layout') with a debounced upsert and last-write-wins on updatedAt.
 * - If the table is missing, falls back to localStorage only (one console.warn).
 */

export type SectionSize = 'compact' | 'normal' | 'wide';

export interface SavedLayout {
  id: string;
  name: string;
  sectionOrder: string[];
  hiddenSections: string[];
  sectionSizes: Record<string, SectionSize>;
}

export interface LayoutState {
  version: number;
  sectionOrder: string[];
  hiddenSections: string[];
  sectionSizes: Record<string, SectionSize>;
  widgetSettings: Record<string, Record<string, unknown>>;
  savedLayouts: SavedLayout[];
  defaultLayoutId: string | null;
  /** epoch ms of the last local edit; 0 = never customized */
  updatedAt: number;
}

export const LAYOUT_VERSION = 2;
export const LEGACY_ORDER_KEY = 'dashboard-section-order';
export const LAYOUT_STORAGE_KEY = 'dashboard-layout-v2';
export const PREF_KIND = 'dashboard';
export const PREF_KEY = 'layout';

/** Sections introduced after v1 that start hidden for everyone (incl. existing users). */
export const DEFAULT_HIDDEN_SECTIONS = ['unified-activity'];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Legacy migration of the plain order array (moved verbatim from the old context initializer):
 * adds automations-section / quick-actions-section when missing.
 */
export function migrateLegacyOrder(parsed: string[]): { order: string[]; changed: boolean } {
  const migrated = [...parsed];
  let changed = false;

  if (!migrated.includes('automations-section')) {
    const quickActionsIndex = migrated.indexOf('quick-actions-section');
    const executiveIndex = migrated.indexOf('executive-overview-section');
    if (quickActionsIndex !== -1) {
      migrated.splice(quickActionsIndex, 0, 'automations-section');
    } else if (executiveIndex !== -1) {
      migrated.splice(executiveIndex + 1, 0, 'automations-section');
    } else {
      migrated.unshift('automations-section');
    }
    changed = true;
  }

  if (!migrated.includes('quick-actions-section')) {
    const automationsIndex = migrated.indexOf('automations-section');
    if (automationsIndex !== -1) {
      migrated.splice(automationsIndex + 1, 0, 'quick-actions-section');
    }
    changed = true;
  }

  return { order: migrated, changed };
}

export function createDefaultLayoutState(defaultOrder: string[]): LayoutState {
  return {
    version: LAYOUT_VERSION,
    sectionOrder: [...defaultOrder, ...DEFAULT_HIDDEN_SECTIONS.filter((s) => !defaultOrder.includes(s))],
    hiddenSections: [...DEFAULT_HIDDEN_SECTIONS],
    sectionSizes: {},
    widgetSettings: {},
    savedLayouts: [],
    defaultLayoutId: null,
    updatedAt: 0,
  };
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Validate/repair an untrusted layout (from localStorage or Supabase). Returns null if unusable. */
export function migrateLayoutState(raw: unknown, defaultOrder: string[]): LayoutState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<LayoutState>;
  if (!isStringArray(r.sectionOrder) || r.sectionOrder.length === 0) return null;

  let sectionOrder = [...r.sectionOrder];
  let hiddenSections = isStringArray(r.hiddenSections) ? [...r.hiddenSections] : [];
  const version = typeof r.version === 'number' ? r.version : 1;

  if (version < 2) {
    // Newly introduced sections show up hidden so nothing moves unexpectedly.
    for (const id of DEFAULT_HIDDEN_SECTIONS) {
      if (!sectionOrder.includes(id)) sectionOrder.push(id);
      if (!hiddenSections.includes(id)) hiddenSections.push(id);
    }
  }
  sectionOrder = Array.from(new Set(sectionOrder));
  hiddenSections = Array.from(new Set(hiddenSections));

  const sectionSizes: Record<string, SectionSize> = {};
  if (r.sectionSizes && typeof r.sectionSizes === 'object') {
    for (const [k, v] of Object.entries(r.sectionSizes)) {
      if (v === 'compact' || v === 'normal' || v === 'wide') sectionSizes[k] = v;
    }
  }

  const savedLayouts: SavedLayout[] = Array.isArray(r.savedLayouts)
    ? r.savedLayouts
        .filter((l) => l && typeof l.id === 'string' && typeof l.name === 'string' && isStringArray(l.sectionOrder))
        .map((l) => ({
          id: l.id,
          name: l.name,
          sectionOrder: [...l.sectionOrder],
          hiddenSections: isStringArray(l.hiddenSections) ? [...l.hiddenSections] : [],
          sectionSizes: { ...(l.sectionSizes || {}) },
        }))
    : [];

  const defaultLayoutId =
    typeof r.defaultLayoutId === 'string' && savedLayouts.some((l) => l.id === r.defaultLayoutId)
      ? r.defaultLayoutId
      : null;

  return {
    version: LAYOUT_VERSION,
    sectionOrder,
    hiddenSections,
    sectionSizes,
    widgetSettings:
      r.widgetSettings && typeof r.widgetSettings === 'object'
        ? (r.widgetSettings as LayoutState['widgetSettings'])
        : {},
    savedLayouts,
    defaultLayoutId,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Initial state: v2 layout if present, else the legacy 'dashboard-section-order' array becomes the
 * initial layout (once; it is then stored as v2), else defaults.
 */
export function loadLocalLayoutState(
  defaultOrder: string[],
  storage: StorageLike | null = safeStorage()
): LayoutState {
  if (storage) {
    try {
      const v2 = storage.getItem(LAYOUT_STORAGE_KEY);
      if (v2) {
        const migrated = migrateLayoutState(JSON.parse(v2), defaultOrder);
        if (migrated) return migrated;
      }
    } catch (error) {
      console.warn('Failed to load dashboard layout from localStorage:', error);
    }
    try {
      const legacy = storage.getItem(LEGACY_ORDER_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { order } = migrateLegacyOrder(parsed);
          const migrated = migrateLayoutState(
            { version: 1, sectionOrder: order, updatedAt: Date.now() },
            defaultOrder
          );
          if (migrated) return migrated;
        }
      }
    } catch (error) {
      console.warn('Failed to load dashboard sections from localStorage:', error);
      try {
        storage.removeItem(LEGACY_ORDER_KEY);
      } catch {
        /* ignore */
      }
    }
  }
  return createDefaultLayoutState(defaultOrder);
}

export function saveLocalLayoutState(state: LayoutState, storage: StorageLike | null = safeStorage()) {
  if (!storage) return;
  try {
    storage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
    // Keep the legacy key in sync for anything still reading it.
    storage.setItem(LEGACY_ORDER_KEY, JSON.stringify(state.sectionOrder));
  } catch {
    /* quota / private mode */
  }
}

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Last-write-wins: returns whichever has the larger updatedAt (local wins ties). */
export function pickNewer<T extends { updatedAt: number }>(local: T, remote: T | null): T {
  if (!remote) return local;
  return remote.updatedAt > local.updatedAt ? remote : local;
}

// ---------------------------------------------------------------------------
// Reducer (saved layouts, hide/show, sizes, widget settings)
// ---------------------------------------------------------------------------

export type LayoutAction =
  | { type: 'setOrder'; order: string[]; now?: number }
  | { type: 'toggle'; id: string; now?: number }
  | { type: 'setSize'; id: string; size: SectionSize; now?: number }
  | { type: 'reset'; defaultOrder: string[]; now?: number }
  | { type: 'saveAs'; name: string; layoutId: string; now?: number }
  | { type: 'apply'; layoutId: string; now?: number }
  | { type: 'rename'; layoutId: string; name: string; now?: number }
  | { type: 'delete'; layoutId: string; now?: number }
  | { type: 'setDefault'; layoutId: string | null; now?: number }
  | { type: 'widgetSettings'; id: string; patch: Record<string, unknown>; now?: number }
  | { type: 'replace'; state: LayoutState };

export function isSectionVisible(state: LayoutState, id: string): boolean {
  return state.sectionOrder.includes(id) && !state.hiddenSections.includes(id);
}

export function getVisibleSections(state: LayoutState): string[] {
  return state.sectionOrder.filter((id) => !state.hiddenSections.includes(id));
}

export function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  if (action.type === 'replace') return action.state;
  const now = action.now ?? Date.now();
  const stamp = (s: Partial<LayoutState>): LayoutState => ({ ...state, ...s, updatedAt: now });

  switch (action.type) {
    case 'setOrder':
      return stamp({ sectionOrder: [...action.order] });
    case 'toggle': {
      if (isSectionVisible(state, action.id)) {
        return stamp({ hiddenSections: [...state.hiddenSections, action.id] });
      }
      return stamp({
        hiddenSections: state.hiddenSections.filter((s) => s !== action.id),
        sectionOrder: state.sectionOrder.includes(action.id)
          ? state.sectionOrder
          : [...state.sectionOrder, action.id],
      });
    }
    case 'setSize':
      return stamp({ sectionSizes: { ...state.sectionSizes, [action.id]: action.size } });
    case 'reset': {
      const def = state.savedLayouts.find((l) => l.id === state.defaultLayoutId);
      if (def) {
        return stamp({
          sectionOrder: [...def.sectionOrder],
          hiddenSections: [...def.hiddenSections],
          sectionSizes: { ...def.sectionSizes },
        });
      }
      const fresh = createDefaultLayoutState(action.defaultOrder);
      return stamp({
        sectionOrder: fresh.sectionOrder,
        hiddenSections: fresh.hiddenSections,
        sectionSizes: {},
      });
    }
    case 'saveAs': {
      const name = action.name.trim();
      if (!name) return state;
      const snapshot: SavedLayout = {
        id: action.layoutId,
        name,
        sectionOrder: [...state.sectionOrder],
        hiddenSections: [...state.hiddenSections],
        sectionSizes: { ...state.sectionSizes },
      };
      const existing = state.savedLayouts.findIndex((l) => l.name.toLowerCase() === name.toLowerCase());
      if (existing !== -1) {
        // Same name overwrites, keeping its id (so default pointer stays valid).
        const kept = state.savedLayouts[existing];
        const next = [...state.savedLayouts];
        next[existing] = { ...snapshot, id: kept.id };
        return stamp({ savedLayouts: next });
      }
      return stamp({ savedLayouts: [...state.savedLayouts, snapshot] });
    }
    case 'apply': {
      const l = state.savedLayouts.find((x) => x.id === action.layoutId);
      if (!l) return state;
      return stamp({
        sectionOrder: [...l.sectionOrder],
        hiddenSections: [...l.hiddenSections],
        sectionSizes: { ...l.sectionSizes },
      });
    }
    case 'rename': {
      const name = action.name.trim();
      if (!name || !state.savedLayouts.some((l) => l.id === action.layoutId)) return state;
      return stamp({
        savedLayouts: state.savedLayouts.map((l) => (l.id === action.layoutId ? { ...l, name } : l)),
      });
    }
    case 'delete':
      return stamp({
        savedLayouts: state.savedLayouts.filter((l) => l.id !== action.layoutId),
        defaultLayoutId: state.defaultLayoutId === action.layoutId ? null : state.defaultLayoutId,
      });
    case 'setDefault':
      if (action.layoutId && !state.savedLayouts.some((l) => l.id === action.layoutId)) return state;
      return stamp({ defaultLayoutId: action.layoutId });
    case 'widgetSettings':
      return stamp({
        widgetSettings: {
          ...state.widgetSettings,
          [action.id]: { ...(state.widgetSettings[action.id] || {}), ...action.patch },
        },
      });
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Supabase access (client injected so it is testable)
// ---------------------------------------------------------------------------

export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; status?: number };
  const msg = (e.message || '').toLowerCase();
  return (
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    e.status === 404 ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

export type RemoteResult<T> = { ok: true; value: T } | { ok: false; missingTable: boolean };

export async function fetchRemoteLayout(
  client: any,
  userId: string,
  defaultOrder: string[]
): Promise<RemoteResult<LayoutState | null>> {
  try {
    const { data, error } = await client
      .from('user_ui_preferences')
      .select('value, updated_at')
      .eq('user_id', userId)
      .eq('kind', PREF_KIND)
      .eq('key', PREF_KEY)
      .maybeSingle();
    if (error) return { ok: false, missingTable: isMissingTableError(error) };
    if (!data) return { ok: true, value: null };
    const value = migrateLayoutState(data.value, defaultOrder);
    if (value && !(value.updatedAt > 0) && data.updated_at) {
      value.updatedAt = Date.parse(data.updated_at) || 0;
    }
    return { ok: true, value };
  } catch (error) {
    return { ok: false, missingTable: isMissingTableError(error) };
  }
}

export async function pushRemoteLayout(
  client: any,
  userId: string,
  state: LayoutState
): Promise<RemoteResult<true>> {
  try {
    const { error } = await client.from('user_ui_preferences').upsert(
      {
        user_id: userId,
        kind: PREF_KIND,
        key: PREF_KEY,
        value: state,
        updated_at: new Date(state.updatedAt || Date.now()).toISOString(),
      },
      { onConflict: 'user_id,kind,key' }
    );
    if (error) return { ok: false, missingTable: isMissingTableError(error) };
    return { ok: true, value: true };
  } catch (error) {
    return { ok: false, missingTable: isMissingTableError(error) };
  }
}

let warnedMissing = false;
function warnMissingOnce() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    'user_ui_preferences table not available; dashboard layout is saved to localStorage only.'
  );
}
/** test helper */
export function __resetMissingWarning() {
  warnedMissing = false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const SAVE_DEBOUNCE_MS = 800;

export function useDashboardLayoutStore(userId: string | null | undefined, defaultOrder: string[]) {
  const [state, setState] = useState<LayoutState>(() => loadLocalLayoutState(defaultOrder));
  const [loading, setLoading] = useState<boolean>(!!userId);
  const stateRef = useRef(state);
  stateRef.current = state;
  const syncedAtRef = useRef(0);
  const remoteDisabledRef = useRef(false);
  const loadedForRef = useRef<string | null>(null);

  const dispatch = useCallback((action: LayoutAction) => {
    setState((prev) => layoutReducer(prev, action));
  }, []);

  // Local cache
  useEffect(() => {
    saveLocalLayoutState(state);
  }, [state]);

  // Load from Supabase on sign-in (last-write-wins)
  useEffect(() => {
    if (!userId) {
      loadedForRef.current = null;
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await fetchRemoteLayout(supabase, userId, defaultOrder);
      if (cancelled) return;
      if (!res.ok) {
        if (res.missingTable) {
          remoteDisabledRef.current = true;
          warnMissingOnce();
        }
      } else {
        const local = stateRef.current;
        const remote = res.value;
        if (remote && remote.updatedAt > local.updatedAt) {
          syncedAtRef.current = remote.updatedAt;
          setState(remote);
        } else if (remote) {
          syncedAtRef.current = remote.updatedAt;
        }
      }
      loadedForRef.current = userId;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced save
  useEffect(() => {
    if (!userId || remoteDisabledRef.current || loadedForRef.current !== userId) return;
    if (!(state.updatedAt > syncedAtRef.current)) return;
    const timer = setTimeout(async () => {
      const snapshot = stateRef.current;
      const res = await pushRemoteLayout(supabase, userId, snapshot);
      if (res.ok) {
        syncedAtRef.current = Math.max(syncedAtRef.current, snapshot.updatedAt);
      } else if (res.missingTable) {
        remoteDisabledRef.current = true;
        warnMissingOnce();
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, userId, loading]);

  return { state, dispatch, loading };
}
