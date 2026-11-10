import React, { useCallback, useEffect, useState } from 'react';
import { api, copyText, errMsg, fmtDate } from './api';

interface Webhook { id: string; url: string; events: string[]; active: boolean; created_at: string }
interface Delivery { id: string; event: string; status: string; attempts: number; response_status: number | null; response_body: string | null; created_at: string; next_attempt_at: string }

const WebhooksPage: React.FC = () => {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [allEvents, setAllEvents] = useState<string[]>(['*']);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['*']);
  const [secret, setSecret] = useState<{ id?: string; value: string } | null>(null);
  const [deliveries, setDeliveries] = useState<{ id: string; rows: Delivery[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ webhooks: Webhook[]; events: string[] }>('/api/outbound-webhooks');
      setHooks(data.webhooks);
      setAllEvents(data.events);
      setError(null);
    } catch (e) {
      setError(errMsg(e, 'Failed to load webhooks'));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleEvent = (ev: string) =>
    setEvents((cur) => (ev === '*' ? ['*'] : cur.includes(ev) ? cur.filter((e) => e !== ev) : [...cur.filter((e) => e !== '*'), ev]));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<{ secret: string }>('/api/outbound-webhooks', { method: 'POST', body: JSON.stringify({ url, events: events.length ? events : ['*'] }) });
      setSecret({ value: data.secret });
      setUrl('');
      await load();
    } catch (err) {
      setError(errMsg(err, 'Failed to create webhook'));
    }
  };

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); } catch (err) { setError(errMsg(err, 'Action failed')); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="text-sm text-gray-600">
          We POST a JSON event to your HTTPS endpoint when contacts, deals, tasks or companies change. Each request carries
          <code className="mx-1">X-SmartCRM-Signature: sha256=HMAC(secret, timestamp + "." + body)</code>
          and <code>X-SmartCRM-Timestamp</code>. Failed deliveries retry with backoff (6 attempts).
        </p>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {secret && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm space-y-2">
          <div className="font-medium">Signing secret (shown once, store it now)</div>
          <code className="block break-all">{secret.value}</code>
          <div className="flex gap-3">
            <button type="button" className="underline" onClick={() => copyText(secret.value)}>Copy</button>
            <button type="button" className="underline" onClick={() => setSecret(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="space-y-3 rounded-md border p-4">
        <label className="block text-sm font-medium" htmlFor="hook-url">Endpoint URL (https)</label>
        <input id="hook-url" required type="url" pattern="https://.*" placeholder="https://example.com/hooks/smartcrm"
          className="w-full rounded-md border px-2 py-1 text-sm" value={url} onChange={(e) => setUrl(e.target.value)} />
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1 font-medium">Events</legend>
          {allEvents.map((ev) => (
            <label key={ev} className="flex items-center gap-1">
              <input type="checkbox" checked={events.includes(ev)} onChange={() => toggleEvent(ev)} /> {ev === '*' ? 'all events' : ev}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">Add webhook</button>
      </form>

      <ul className="space-y-3">
        {hooks.length === 0 && <li className="text-sm text-gray-500">No webhooks yet.</li>}
        {hooks.map((h) => (
          <li key={h.id} className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="break-all font-mono">{h.url}</span>
              <span className={h.active ? 'text-green-700' : 'text-gray-500'}>{h.active ? 'active' : 'paused'}</span>
            </div>
            <div className="text-xs text-gray-500">{h.events.join(', ')} - created {fmtDate(h.created_at)}</div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="underline" onClick={() => act(() => api(`/api/outbound-webhooks/${h.id}`, { method: 'PATCH', body: JSON.stringify({ active: !h.active }) }))}>
                {h.active ? 'Pause' : 'Resume'}
              </button>
              <button type="button" className="underline" onClick={() => act(async () => {
                const r = await api<{ secret: string }>(`/api/outbound-webhooks/${h.id}`, { method: 'PATCH', body: JSON.stringify({ rotateSecret: true }) });
                setSecret({ id: h.id, value: r.secret });
              })}>Rotate secret</button>
              <button type="button" className="underline" onClick={async () => {
                try {
                  const r = await api<{ deliveries: Delivery[] }>(`/api/outbound-webhooks/${h.id}/deliveries`);
                  setDeliveries({ id: h.id, rows: r.deliveries });
                } catch (err) { setError(errMsg(err, 'Failed to load deliveries')); }
              }}>Deliveries</button>
              <button type="button" className="text-red-600 underline" onClick={() => act(() => api(`/api/outbound-webhooks/${h.id}`, { method: 'DELETE' }))}>Delete</button>
            </div>
            {deliveries?.id === h.id && (
              <table className="w-full text-left text-xs">
                <thead><tr><th>Event</th><th>Status</th><th>Attempts</th><th>HTTP</th><th>When</th></tr></thead>
                <tbody>
                  {deliveries.rows.length === 0 && <tr><td colSpan={5} className="py-1 text-gray-500">No deliveries yet.</td></tr>}
                  {deliveries.rows.map((d) => (
                    <tr key={d.id} title={d.response_body ?? ''}>
                      <td>{d.event}</td><td>{d.status}</td><td>{d.attempts}</td><td>{d.response_status ?? '-'}</td><td>{fmtDate(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WebhooksPage;
