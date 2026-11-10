import React, { useCallback, useEffect, useState } from 'react';
import { api, copyText, errMsg, fmtDate } from './api';

interface Key { id: string; name: string; prefix: string; scopes: string[]; last_used_at: string | null; revoked_at: string | null; created_at: string }

/** Public REST API keys (distinct from /settings/api-keys, which holds your OpenAI key). */
const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<Key[]>([]);
  const [allScopes, setAllScopes] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ keys: Key[]; scopes: string[] }>('/api/public-api-keys');
      setKeys(data.keys);
      setAllScopes(data.scopes);
      setError(null);
    } catch (e) {
      setError(errMsg(e, 'Failed to load API keys'));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api<{ secret: string }>('/api/public-api-keys', { method: 'POST', body: JSON.stringify({ name, scopes }) });
      setSecret(data.secret);
      setName('');
      setScopes([]);
      await load();
    } catch (err) {
      setError(errMsg(err, 'Failed to create key'));
    }
  };

  const revoke = async (id: string) => {
    if (!window.confirm('Revoke this key? Applications using it stop working immediately.')) return;
    try { await api(`/api/public-api-keys/${id}`, { method: 'DELETE' }); await load(); }
    catch (err) { setError(errMsg(err, 'Failed to revoke key')); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">API keys</h1>
        <p className="text-sm text-gray-600">
          Keys for the public REST API (<code>/api/v1</code>). Send <code>Authorization: Bearer sk_live_...</code>. Keys only see your own data,
          are limited to 120 requests per minute and to the scopes you pick. See the <a className="underline" href="/settings/api-docs">API docs</a>.
        </p>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {secret && (
        <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <div className="font-medium">Your new key (shown once, we only store a hash)</div>
          <code className="block break-all">{secret}</code>
          <div className="flex gap-3">
            <button type="button" className="underline" onClick={() => copyText(secret)}>Copy</button>
            <button type="button" className="underline" onClick={() => setSecret(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="space-y-3 rounded-md border p-4">
        <label className="block text-sm font-medium" htmlFor="key-name">Name</label>
        <input id="key-name" required maxLength={80} className="w-full rounded-md border px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <fieldset className="grid grid-cols-2 gap-1 text-sm md:grid-cols-4">
          <legend className="mb-1 font-medium">Scopes</legend>
          {allScopes.map((s) => (
            <label key={s} className="flex items-center gap-1">
              <input type="checkbox" checked={scopes.includes(s)} onChange={() => setScopes((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])} /> {s}
            </label>
          ))}
        </fieldset>
        <button type="submit" disabled={scopes.length === 0} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">Create key</button>
      </form>

      <table className="w-full text-left text-sm">
        <thead><tr><th>Name</th><th>Key</th><th>Scopes</th><th>Last used</th><th /></tr></thead>
        <tbody>
          {keys.length === 0 && <tr><td colSpan={5} className="py-2 text-gray-500">No keys yet.</td></tr>}
          {keys.map((k) => (
            <tr key={k.id} className="border-t align-top">
              <td className="py-2">{k.name}</td>
              <td className="font-mono text-xs">{k.prefix}...</td>
              <td className="text-xs">{k.scopes.join(', ')}</td>
              <td className="text-xs">{k.revoked_at ? `revoked ${fmtDate(k.revoked_at)}` : fmtDate(k.last_used_at)}</td>
              <td>{!k.revoked_at && <button type="button" className="text-red-600 underline" onClick={() => revoke(k.id)}>Revoke</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApiKeysPage;
