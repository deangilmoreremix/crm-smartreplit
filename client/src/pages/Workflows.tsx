import React, { useCallback, useEffect, useState } from 'react';
import { WorkflowBuilder } from '../../../packages/ui/src/components/workflows/WorkflowBuilder';
import type {
  Workflow as BuilderWorkflow,
} from '../../../packages/ui/src/components/workflows/WorkflowBuilder';
import { WorkflowMonitor } from '../../../packages/ui/src/components/workflows/WorkflowMonitor';
import WorkflowTriggersPanel from './automation/WorkflowTriggersPanel';

interface WorkflowSummary {
  id: string;
  name: string;
  triggerType: string;
  enabled: boolean;
}

const emptyWorkflow = (): BuilderWorkflow => ({
  name: '',
  triggerType: 'MANUAL',
  appSlug: 'contacts',
  steps: [],
});

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BuilderWorkflow>(emptyWorkflow());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    try {
      const data = await api<{ workflows: WorkflowSummary[] }>('/api/workflows');
      setWorkflows(data.workflows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const select = async (id: string | null) => {
    setSelectedId(id);
    if (!id) {
      setDraft(emptyWorkflow());
      return;
    }
    try {
      const data = await api<{ workflow: BuilderWorkflow }>(`/api/workflows/${id}`);
      setDraft(data.workflow);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workflow');
    }
  };

  const save = async (workflow: BuilderWorkflow) => {
    try {
      const payload = JSON.stringify({
        name: workflow.name,
        triggerType: workflow.triggerType,
        appSlug: workflow.appSlug,
        steps: workflow.steps,
      });
      if (selectedId) {
        await api(`/api/workflows/${selectedId}`, { method: 'PUT', body: payload });
      } else {
        const created = await api<{ workflow: { id: string } }>('/api/workflows', {
          method: 'POST',
          body: payload,
        });
        setSelectedId(created.workflow.id);
      }
      setError(null);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save workflow');
      throw e;
    }
  };

  const runNow = async (workflowId: string) => {
    try {
      await api(`/api/workflows/${workflowId}/run`, { method: 'POST', body: '{}' });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run workflow');
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/workflows/${id}`, { method: 'DELETE' });
      await select(null);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete workflow');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm"
          onClick={() => select(null)}
        >
          New workflow
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {!loading && workflows.length === 0 && (
            <p className="text-sm text-gray-500">No workflows yet.</p>
          )}
          {workflows.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => select(w.id)}
              className={`w-full rounded-md border p-3 text-left text-sm ${
                w.id === selectedId ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="font-medium">{w.name}</div>
              <div className="text-xs text-gray-500">
                {w.triggerType} {w.enabled ? '' : '(disabled)'}
              </div>
            </button>
          ))}
        </aside>

        <main className="space-y-6">
          <WorkflowBuilder
            key={selectedId ?? 'new'}
            workflow={draft}
            onChange={setDraft}
            onSave={save}
          />
          {selectedId && (
            <>
              <WorkflowTriggersPanel workflowId={selectedId} />
              <WorkflowMonitor workflowId={selectedId} onRunWorkflow={runNow} />
              <button
                type="button"
                className="text-sm text-red-600 underline"
                onClick={() => remove(selectedId)}
              >
                Delete workflow
              </button>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Workflows;
