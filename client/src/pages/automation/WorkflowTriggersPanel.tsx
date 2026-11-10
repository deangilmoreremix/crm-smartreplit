import React, { useCallback, useEffect, useState } from 'react';
import { api, copyText, errMsg, fmtDate } from './api';
import WorkflowVersions from './WorkflowVersions';

interface Triggers {
  scheduleCron: string | null;
  nextRunAt: string | null;
  webhookPath: string | null;
  triggerType: string;
}

const PRESETS: Array<[string, string]> = [
  ['Every 5 minutes', '*/5 * * * *'],
  ['Hourly', '0 * * * *'],
  ['Daily 09:00 UTC', '0 9 * * *'],
  ['Weekdays 09:00 UTC', '0 9 * * 1-5'],
];

/** Trigger configuration (cron schedule, inbound webhook URL) and versions for one workflow. */
const WorkflowTriggersPanel: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const [t, setT] = useState<Triggers | null>(null);
  const [cron, setCron] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<Triggers>(`/api/workflows/${workflowId}/triggers`);
      setT(data);
      setCron(data.scheduleCron ?? '');
      setError(null);
    } catch (e) {
      setError(errMsg(e, 'Failed to load triggers'));
    }
  }, [workflowId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn();
      setNotice(done ?? null);
      await load();
    } catch (e) {
      setError(errMsg(e, 'Action failed'));
    }
  };

  const hookUrl = t?.webhookPath ? `${window.location.origin}${t.webhookPath}` : null;

  return (
    <div className="space-y-4">
      <section className="rounded-md border p-4 space-y-4">
        <h3 className="font-medium">Triggers</h3>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p className="text-sm text-green-700">{notice}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="wf-cron">Schedule (cron, UTC)</label>
          <div className="flex flex-wrap gap-2">
            <input id="wf-cron" className="rounded-md border px-2 py-1 text-sm font-mono" placeholder="*/5 * * * *"
              value={cron} onChange={(e) => setCron(e.target.value)} />
            <button type="button" className="rounded-md border px-3 py-1 text-sm"
              onClick={() => run(() => api(`/api/workflows/${workflowId}/triggers`, { method: 'PUT', body: JSON.stringify({ scheduleCron: cron.trim() || null }) }), 'Schedule saved')}>
              Save
            </button>
            {PRESETS.map(([label, value]) => (
              <button key={value} type="button" className="text-xs text-blue-600 underline" onClick={() => setCron(value)}>{label}</button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Next run: {fmtDate(t?.nextRunAt)}. The workflow must be enabled. The scheduler checks every minute.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Inbound webhook</div>
          {t && t.triggerType !== 'WEBHOOK' && (
            <p className="text-xs text-amber-700">The trigger type must be WEBHOOK for this URL to start runs.</p>
          )}
          {hookUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-gray-100 px-2 py-1 text-xs">{hookUrl}</code>
              <button type="button" className="rounded-md border px-3 py-1 text-sm"
                onClick={async () => setNotice((await copyText(hookUrl)) ? 'URL copied' : 'Copy failed')}>Copy</button>
              <button type="button" className="text-sm text-blue-600 underline"
                onClick={() => run(() => api(`/api/workflows/${workflowId}/webhook-token`, { method: 'POST', body: '{}' }), 'Token rotated: the old URL no longer works')}>Rotate</button>
              <button type="button" className="text-sm text-red-600 underline"
                onClick={() => run(() => api(`/api/workflows/${workflowId}/webhook-token`, { method: 'DELETE' }), 'Webhook disabled')}>Disable</button>
            </div>
          ) : (
            <button type="button" className="rounded-md border px-3 py-1 text-sm"
              onClick={() => run(() => api(`/api/workflows/${workflowId}/webhook-token`, { method: 'POST', body: '{}' }), 'Webhook URL created')}>
              Generate webhook URL
            </button>
          )}
          <p className="text-xs text-gray-500">POST JSON (max 64 KB). The URL is the secret: treat it like a password.</p>
        </div>
      </section>
      <WorkflowVersions workflowId={workflowId} />
    </div>
  );
};

export default WorkflowTriggersPanel;
