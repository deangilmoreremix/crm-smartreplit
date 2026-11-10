import React, { useEffect, useState } from 'react';

interface Operation { summary?: string; description?: string; parameters?: Array<{ name: string; in: string }> }

/** Renders /api/v1/openapi.json as a readable reference (no external libraries). */
const ApiDocsPage: React.FC = () => {
  const [doc, setDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/openapi.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Failed to load spec (${r.status})`))))
      .then(setDoc)
      .catch((e) => setError(e.message));
  }, []);

  const base = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1';
  const rows: Array<{ method: string; path: string; op: Operation }> = [];
  for (const [path, item] of Object.entries<any>(doc?.paths ?? {})) {
    for (const method of ['get', 'post', 'patch', 'delete']) {
      if (item[method]) rows.push({ method: method.toUpperCase(), path, op: item[method] });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">API documentation</h1>
        <p className="text-sm text-gray-600">
          Base URL <code>{base}</code>. Machine-readable spec: <a className="underline" href="/api/v1/openapi.json">openapi.json</a> (OpenAPI 3.1).
          Create keys under <a className="underline" href="/settings/api-keys-public">Settings &gt; API keys</a>.
        </p>
      </div>
      {error && <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-2 text-sm">
        <h2 className="font-medium">Authentication and limits</h2>
        <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">{`curl ${base}/contacts?limit=25 \\
  -H "Authorization: Bearer sk_live_..."`}</pre>
        <ul className="list-disc pl-5 text-gray-700">
          <li>Scopes: <code>read:&lt;object&gt;</code> and <code>write:&lt;object&gt;</code> for contacts, deals, tasks, companies.</li>
          <li>120 requests per minute per key; see <code>X-RateLimit-Remaining</code> and <code>Retry-After</code>.</li>
          <li>Lists use cursor pagination: pass <code>next_cursor</code> as <code>cursor</code> while <code>has_more</code> is true.</li>
          <li>Errors: <code>{`{ "error": { "code": "...", "message": "..." } }`}</code></li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Endpoints</h2>
        {!doc && !error && <p className="text-sm text-gray-500">Loading...</p>}
        <ul className="divide-y rounded-md border text-sm">
          {rows.map(({ method, path, op }) => (
            <li key={`${method}${path}`} className="p-3">
              <div className="font-mono"><span className="mr-2 font-semibold">{method}</span>/api/v1{path}</div>
              <div className="text-gray-600">{op.summary}{op.description ? ` - ${op.description}` : ''}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ApiDocsPage;
