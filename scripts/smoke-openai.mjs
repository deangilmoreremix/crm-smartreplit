#!/usr/bin/env node
/**
 * Live smoke test for the Responses API migration.
 * Usage: OPENAI_API_KEY=sk-... node scripts/smoke-openai.mjs
 * Confirms each tier's model ID exists for your key, plus JSON output, streaming and a tool loop.
 */
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('Set OPENAI_API_KEY');
  process.exit(1);
}

const tiers = {
  fast: process.env.OPENAI_MODEL_FAST || 'gpt-6-luna',
  default: process.env.OPENAI_MODEL_DEFAULT || 'gpt-6.1-terra',
  deep: process.env.OPENAI_MODEL_DEEP || 'gpt-6.1-sol',
  max: process.env.OPENAI_MODEL_MAX || 'gpt-6-astra',
};

const call = async (body) => {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
  return json;
};
const text = (r) =>
  r.output_text ??
  (r.output || [])
    .filter((i) => i.type === 'message')
    .flatMap((i) => i.content)
    .filter((c) => c.type === 'output_text')
    .map((c) => c.text)
    .join('');

let failed = 0;
const check = async (name, fn) => {
  try {
    const detail = await fn();
    console.log(`PASS ${name}${detail ? ` - ${detail}` : ''}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name} - ${e.message}`);
  }
};

for (const [tier, model] of Object.entries(tiers)) {
  await check(`model ${tier} (${model})`, async () => {
    const r = await call({ model, input: 'Reply with the single word: ok', max_output_tokens: 200, store: false, reasoning: { effort: 'low' } });
    return text(r).trim().slice(0, 40);
  });
}

await check('json_object output (fast)', async () => {
  const r = await call({
    model: tiers.fast,
    input: 'Return JSON {"ok":true}',
    text: { format: { type: 'json_object' } },
    max_output_tokens: 200,
    store: false,
  });
  JSON.parse(text(r));
});

await check('tool loop (deep)', async () => {
  const tools = [{ type: 'function', name: 'add', description: 'Add two numbers', parameters: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'], additionalProperties: false }, strict: true }];
  let context = [{ role: 'user', content: 'Use the add tool for 2 + 3, then tell me the result.' }];
  let r = await call({ model: tiers.deep, input: context, tools, store: false, include: ['reasoning.encrypted_content'], reasoning: { effort: 'low' } });
  const calls = r.output.filter((i) => i.type === 'function_call');
  if (!calls.length) throw new Error('model did not call the tool');
  context = [...context, ...r.output, ...calls.map((c) => ({ type: 'function_call_output', call_id: c.call_id, output: JSON.stringify({ sum: 5 }) }))];
  r = await call({ model: tiers.deep, input: context, tools, store: false, include: ['reasoning.encrypted_content'], reasoning: { effort: 'low' } });
  return text(r).trim().slice(0, 60);
});

await check('streaming (default)', async () => {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: tiers.default, input: 'Say hello', stream: true, store: false, max_output_tokens: 200, reasoning: { effort: 'low' } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  if (!body.includes('response.output_text.delta')) throw new Error('no output_text.delta events');
});

await check('embeddings', async () => {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: 'hello' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message);
});

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
