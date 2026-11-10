/** Minimal 5-field cron (UTC): `min hour dom month dow`; supports *, lists, ranges, steps, @aliases. */
const ALIASES: Record<string, string> = {
  '@hourly': '0 * * * *',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@weekly': '0 0 * * 0',
  '@monthly': '0 0 1 * *',
  '@yearly': '0 0 1 1 *',
};

interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
  domAny: boolean;
  dowAny: boolean;
}

function parseField(field: string, min: number, max: number, name: string): Set<number> {
  const out = new Set<number>();
  for (const part of field.split(',')) {
    const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) throw new Error(`Invalid cron ${name} field: "${field}"`);
    const step = m[2] ? Number(m[2]) : 1;
    if (step < 1) throw new Error(`Invalid cron ${name} step`);
    let lo = min;
    let hi = max;
    if (m[1] !== '*') {
      const [a, b] = m[1].split('-').map(Number);
      lo = a;
      hi = b ?? (m[2] ? max : a);
    }
    if (lo < min || hi > max || lo > hi) throw new Error(`Cron ${name} out of range: "${part}"`);
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export function parseCron(expr: string): ParsedCron {
  const normalized = ALIASES[expr.trim().toLowerCase()] ?? expr.trim();
  const f = normalized.split(/\s+/);
  if (f.length !== 5) throw new Error('Cron expression must have 5 fields');
  const dow = parseField(f[4], 0, 7, 'day-of-week');
  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }
  return {
    minute: parseField(f[0], 0, 59, 'minute'),
    hour: parseField(f[1], 0, 23, 'hour'),
    dom: parseField(f[2], 1, 31, 'day-of-month'),
    month: parseField(f[3], 1, 12, 'month'),
    dow,
    domAny: f[2] === '*',
    dowAny: f[4] === '*',
  };
}

export function isValidCron(expr: string): boolean {
  try {
    parseCron(expr);
    return true;
  } catch {
    return false;
  }
}

/** Next fire time strictly after `after` (UTC), or null when none within ~5 years. */
export function nextCronRun(expr: string, after: Date = new Date()): Date | null {
  const c = parseCron(expr);
  const d = new Date(after.getTime());
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  const limit = after.getTime() + 5 * 366 * 24 * 3600 * 1000;

  while (d.getTime() <= limit) {
    if (!c.month.has(d.getUTCMonth() + 1)) {
      d.setUTCMonth(d.getUTCMonth() + 1, 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    const domOk = c.dom.has(d.getUTCDate());
    const dowOk = c.dow.has(d.getUTCDay());
    const dayOk = c.domAny || c.dowAny ? domOk && dowOk : domOk || dowOk;
    if (!dayOk) {
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!c.hour.has(d.getUTCHours())) {
      d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (!c.minute.has(d.getUTCMinutes())) {
      d.setUTCMinutes(d.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    return d;
  }
  return null;
}
