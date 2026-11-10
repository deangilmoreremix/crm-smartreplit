#!/usr/bin/env node
// Type-check ratchet: fails only when the count of errors for any (file, TS code)
// pair rises above the committed baseline (or a new pair appears).
//
//   node scripts/typecheck-ratchet.mjs [--target client|server] [--update]
//
// Default target is "client". Baselines live next to this script:
//   client -> scripts/typecheck-baseline.txt
//   server -> scripts/typecheck-baseline-server.txt
// Baseline line format: "<file>: <TScode> <count>" (line/column are not tracked,
// so unrelated edits that shift line numbers never break the gate).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const update = args.includes('--update');
const ti = args.indexOf('--target');
const target = ti >= 0 ? args[ti + 1] : 'client';

const targets = {
  client: { project: 'client/tsconfig.json', baseline: 'scripts/typecheck-baseline.txt' },
  server: { project: 'tsconfig.json', baseline: 'scripts/typecheck-baseline-server.txt' },
};
const cfg = targets[target];
if (!cfg) {
  console.error(`Unknown --target "${target}" (use client or server)`);
  process.exit(2);
}
const baselinePath = path.join(root, cfg.baseline);

const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const res = spawnSync(
  process.execPath,
  [tscBin, '--noEmit', '--pretty', 'false', '-p', cfg.project],
  { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
);
if (res.error) {
  console.error(res.error);
  process.exit(2);
}
const out = `${res.stdout || ''}${res.stderr || ''}`;

const counts = new Map();
for (const line of out.split('\n')) {
  const m = /^(.+?)\(\d+,\d+\): error (TS\d+):/.exec(line) || /^()error (TS\d+):/.exec(line);
  if (!m) continue;
  const file = (m[1] || '(global)').replace(/\\/g, '/');
  const key = `${file}: ${m[2]}`;
  counts.set(key, (counts.get(key) || 0) + 1);
}

if (res.status !== 0 && counts.size === 0) {
  console.error('tsc failed without reporting type errors:\n' + out);
  process.exit(2);
}

const serialize = (map) =>
  [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, n]) => `${k} ${n}`)
    .join('\n') + (map.size ? '\n' : '');

const total = [...counts.values()].reduce((a, b) => a + b, 0);

if (update) {
  fs.writeFileSync(baselinePath, serialize(counts));
  console.log(`[${target}] baseline updated: ${total} errors in ${counts.size} file+code entries -> ${cfg.baseline}`);
  process.exit(0);
}

const baseline = new Map();
if (fs.existsSync(baselinePath)) {
  for (const line of fs.readFileSync(baselinePath, 'utf8').split('\n')) {
    const m = /^(.+: TS\d+) (\d+)$/.exec(line.trim());
    if (m) baseline.set(m[1], Number(m[2]));
  }
} else {
  console.error(`Missing baseline ${cfg.baseline}; run with --update to create it.`);
  process.exit(2);
}

const regressions = [];
const improvements = [];
for (const [k, n] of counts) {
  const b = baseline.get(k) || 0;
  if (n > b) regressions.push(`${k}: ${b} -> ${n}`);
}
for (const [k, b] of baseline) {
  const n = counts.get(k) || 0;
  if (n < b) improvements.push(`${k}: ${b} -> ${n}`);
}

const baseTotal = [...baseline.values()].reduce((a, b) => a + b, 0);
console.log(`[${target}] ${total} errors now, ${baseTotal} in baseline.`);
if (regressions.length) {
  console.error(`\nType-check ratchet FAILED: ${regressions.length} file+code entries got worse:`);
  for (const r of regressions) console.error('  ' + r);
  console.error('\nFix the new errors (do not just update the baseline).');
  process.exit(1);
}
if (improvements.length) {
  console.log(`\n${improvements.length} entries improved. Lock in the gains: node scripts/typecheck-ratchet.mjs --target ${target} --update`);
}
console.log('Type-check ratchet OK.');
