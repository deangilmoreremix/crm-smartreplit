/**
 * Migration validity guards, including the PR #5 RLS policy regression.
 *
 * The audit-log migration created an INSERT policy with `USING (true)`, which is
 * invalid PostgreSQL: `USING` applies to SELECT/UPDATE/DELETE, while INSERT
 * policies must use `WITH CHECK`. The migration therefore failed to apply, which
 * means `password_change_audit_log` had no RLS policy at all.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const sqlOf = (file: string): string => readFileSync(join(migrationsDir, file), 'utf8');

/** Remove line and block comments so structural checks are not fooled by text. */
const stripComments = (sql: string): string =>
  sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');

const statementsOf = (sql: string): string[] =>
  stripComments(sql)
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

describe('supabase migrations', () => {
  it('finds migration files', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it('every migration has balanced parentheses', () => {
    for (const file of migrationFiles) {
      const sql = sqlOf(file);
      const open = (sql.match(/\(/g) || []).length;
      const close = (sql.match(/\)/g) || []).length;
      expect(open, `${file} has unbalanced parentheses`).toBe(close);
    }
  });

  it('every migration has balanced dollar-quotes around PL/pgSQL bodies', () => {
    for (const file of migrationFiles) {
      const sql = sqlOf(file);
      const dollarQuotes = (sql.match(/\$\$/g) || []).length;
      expect(dollarQuotes % 2, `${file} has an odd number of $$ delimiters`).toBe(0);
    }
  });

  it('every non-empty migration parses into statements', () => {
    for (const file of migrationFiles) {
      const statements = statementsOf(sqlOf(file));
      if (statements.length === 0) {
        // Empty or comment-only placeholder migrations exist in the repo
        // (e.g. `*_remote_applied.sql` records a migration applied remotely).
        // They must carry no executable SQL beyond their comments.
        const code = stripComments(sqlOf(file)).trim();
        expect(code, `${file} has no statements but contains code`).toBe('');
        continue;
      }
      expect(statements.length, `${file} contains no statements`).toBeGreaterThan(0);
    }
  });

  it('never uses USING for an INSERT-only policy (PR #5 P1)', () => {
    for (const file of migrationFiles) {
      for (const statement of statementsOf(sqlOf(file))) {
        if (!/CREATE POLICY/i.test(statement)) continue;
        if (!/FOR INSERT/i.test(statement)) continue;

        expect(
          /USING\s*\(/i.test(statement),
          `${file}: INSERT policy uses USING, which is invalid PostgreSQL — use WITH CHECK`
        ).toBe(false);
        expect(
          /WITH CHECK\s*\(/i.test(statement),
          `${file}: INSERT policy is missing WITH CHECK`
        ).toBe(true);
      }
    }
  });

  it('the password-change audit-log migration applies its INSERT policy correctly', () => {
    const file = '20260605000000_password_change_audit_log.sql';
    const sql = sqlOf(file);

    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(sql).toMatch(/CREATE TABLE[^;]*password_change_audit_log/i);

    const insertPolicy = statementsOf(sql).find(
      (statement) => /FOR INSERT/i.test(statement) && /WITH CHECK\s*\(/i.test(statement)
    );
    expect(insertPolicy, 'expected an INSERT policy using WITH CHECK').toBeDefined();

    // No dangling USING clause attached to an INSERT policy anywhere in the file.
    expect(/FOR INSERT[\s\S]{0,240}?USING\s*\(/i.test(sql)).toBe(false);
  });
});
