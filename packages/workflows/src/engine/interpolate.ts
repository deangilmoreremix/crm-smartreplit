/**
 * Safe `{{path}}` templating. Path lookup only: no eval, no function calls, no prototype access.
 *   {{trigger.email}}  {{steps.<id>.output.x}}  {{record.name}}  {{item.id}}
 * - A string that is exactly one expression keeps the raw value type (array, number, object).
 * - Inside longer strings values are stringified (objects as JSON); missing values become ''.
 * - `\{{x}}` is an escape and renders literally as `{{x}}`.
 * - Only own properties are followed; __proto__/constructor/prototype are blocked.
 */
const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);
const EXPR = /^[A-Za-z_][\w-]*(?:\.[\w-]+|\[\d+\])*$/;
const TOKEN = /(\\)?\{\{\s*([^{}]*?)\s*\}\}/g;
const MAX_DEPTH = 20;

export function getPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter((p) => p !== '');
  let cur: unknown = obj;
  for (const part of parts) {
    if (BLOCKED.has(part)) return undefined;
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(cur, part)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export interface InterpolateOptions {
  /** JSON-escape substituted strings so templates like '{"a":"{{x}}"}' stay valid JSON. */
  escapeJson?: boolean;
  /** Keys whose values are left untouched when walking objects (e.g. nested steps). */
  skipKeys?: readonly string[];
}

const jsonEscape = (s: string) => JSON.stringify(s).slice(1, -1);

function stringify(v: unknown, opts: InterpolateOptions): string {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return opts.escapeJson ? jsonEscape(s) : s;
}

export function interpolateString(
  template: string,
  scope: Record<string, unknown>,
  opts: InterpolateOptions = {}
): unknown {
  const whole = template.match(/^\s*\{\{\s*([^{}]*?)\s*\}\}\s*$/);
  if (whole && EXPR.test(whole[1]) && !opts.escapeJson) {
    return getPath(scope, whole[1]);
  }
  return template.replace(TOKEN, (match, esc: string | undefined, expr: string) => {
    if (esc) return match.slice(1); // drop the backslash, keep literal braces
    if (!EXPR.test(expr)) return match;
    return stringify(getPath(scope, expr), opts);
  });
}

export function interpolate(
  value: unknown,
  scope: Record<string, unknown>,
  opts: InterpolateOptions = {},
  depth = 0
): unknown {
  if (depth > MAX_DEPTH) throw new Error('Template structure is too deeply nested');
  if (typeof value === 'string') return interpolateString(value, scope, opts);
  if (Array.isArray(value)) return value.map((v) => interpolate(v, scope, opts, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (BLOCKED.has(k)) continue;
      out[k] = opts.skipKeys?.includes(k) ? v : interpolate(v, scope, opts, depth + 1);
    }
    return out;
  }
  return value;
}
