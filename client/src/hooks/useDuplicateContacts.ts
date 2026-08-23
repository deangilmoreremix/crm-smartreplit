import { useState, useEffect } from 'react';

export interface DuplicateGroup {
  contactA: any;
  contactB: any;
  reason: 'email' | 'phone' | 'name_company';
  matchScore: number;
  merged: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    position: string;
    industry: string;
    status: string;
    notes: string;
    tags: string[];
  };
}

export interface DuplicateState {
  duplicates: DuplicateGroup[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  mergingId: string | null;
  mergeError: string | null;
}

export function useDuplicateContacts() {
  const [state, setState] = useState<DuplicateState>({
    duplicates: [],
    loading: false,
    error: null,
    refreshing: false,
    mergingId: null,
    mergeError: null,
  });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/contacts/duplicates', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load duplicates');
      }

      const data = await response.json();
      setState((prev) => ({ ...prev, duplicates: data.duplicates || [], loading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load duplicates',
      }));
    }
  };

  const refresh = async () => {
    setState((prev) => ({ ...prev, refreshing: true, error: null }));
    try {
      const response = await fetch('/api/contacts/duplicates', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to refresh duplicates');
      }

      const data = await response.json();
      setState((prev) => ({ ...prev, duplicates: data.duplicates || [], refreshing: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        refreshing: false,
        error: err instanceof Error ? err.message : 'Failed to refresh duplicates',
      }));
    }
  };

  const merge = async (group: DuplicateGroup) => {
    setState((prev) => ({ ...prev, mergingId: `${group.contactA.id}-${group.contactB.id}`, mergeError: null }));
    try {
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          primaryId: group.contactA.id,
          duplicateId: group.contactB.id,
          mergedFields: group.merged,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to merge contacts');
      }

      setState((prev) => ({
        ...prev,
        duplicates: prev.duplicates.filter(
          (item) =>
            item !== group &&
            !(item.contactA.id === group.contactA.id && item.contactB.id === group.contactB.id) &&
            !(item.contactA.id === group.contactB.id && item.contactB.id === group.contactA.id)
        ),
        mergingId: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        mergingId: null,
        mergeError: err instanceof Error ? err.message : 'Failed to merge contacts',
      }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    duplicates: state.duplicates,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    mergingId: state.mergingId,
    mergeError: state.mergeError,
    refresh,
    merge,
  };
}
