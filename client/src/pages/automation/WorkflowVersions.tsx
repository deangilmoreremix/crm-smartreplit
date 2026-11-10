import React, { useCallback, useEffect, useState } from 'react';
import { api, errMsg, fmtDate } from './api';

interface Version {
  id: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  stepCount: number;
}

/**
 * Published versions of a workflow. While a version is active, triggers run that snapshot; with
 * none active they run the live steps from the builder. Publishing snapshots the current steps.
 */
const WorkflowVersions: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ versions: Version[]; activeVersionId: string | null }>(`/api/workflows/${workflowId}/versions`);
      setVersions(data.versions);
      setActiveId(data.activeVersionId);
      setError(null);
    } catch (e) {
      setError(errMsg(e, 'Failed to load versions'));
    }
  }, [workflowId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errMsg(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Versions</h3>
        <div className="flex gap-2">
          <button type="button" disabled={busy} className="rounded-md border px-3 py-1 text-sm"
            onClick={() => act(() => api(`/api/workflows/${workflowId}/versions`, { method: 'POST', body: '{}' }))}>
            Save draft
          </button>
          <button type="button" disabled={busy} className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white"
            onClick={() => act(() => api(`/api/workflows/${workflowId}/publish`, { method: 'POST', body: '{}' }))}>
            Publish current steps
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {activeId ? 'Triggers run the active published version.' : 'No version is active: triggers run the live steps.'}
      </p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {versions.length === 0 ? (
        <p className="text-sm text-gray-500">No versions yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2">
              <span>
                v{v.version} <span className="text-xs text-gray-500">({v.status}, {v.stepCount} steps, {fmtDate(v.createdAt)})</span>
              </span>
              {v.status !== 'active' && (
                <button type="button" disabled={busy} className="text-blue-600 underline"
                  onClick={() => act(() => api(`/api/workflows/${workflowId}/versions/${v.id}/activate`, { method: 'POST', body: '{}' }))}>
                  Activate
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {activeId && (
        <button type="button" disabled={busy} className="text-sm text-gray-600 underline"
          onClick={() => act(() => api(`/api/workflows/${workflowId}/active-version`, { method: 'DELETE' }))}>
          Deactivate (run live steps)
        </button>
      )}
    </section>
  );
};

export default WorkflowVersions;
