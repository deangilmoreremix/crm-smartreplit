import { describe, it, expect } from 'vitest';
import {
  validateObjectInput, validateFieldInput, validateOptions, validateRecordData, parseFilters,
  encodeCursor, decodeCursor, canDo, maskData, clampLimit, validateEmail,
} from '../dataModel';

const fields: any[] = [
  { name: 'title', field_type: 'text', is_required: true },
  { name: 'amount', field_type: 'currency' },
  { name: 'stage', field_type: 'select', options: [{ value: 'new', label: 'New' }] },
  { name: 'done', field_type: 'boolean' },
  { name: 'meta', field_type: 'json' },
];

describe('validateObjectInput', () => {
  const ok = { name_singular: 'project', name_plural: 'projects', label_singular: 'Project', label_plural: 'Projects' };
  it('accepts valid input', () => expect(validateObjectInput(ok).ok).toBe(true));
  it('rejects bad names', () => {
    expect(validateObjectInput({ ...ok, name_singular: 'Bad Name' }).ok).toBe(false);
    expect(validateObjectInput({ ...ok, name_plural: 'x; drop' }).ok).toBe(false);
  });
  it('rejects standard object collisions', () => expect(validateObjectInput({ ...ok, name_singular: 'contact', name_plural: 'contacts' }).ok).toBe(false));
});

describe('validateFieldInput / options', () => {
  it('rejects unknown type', () => expect(validateFieldInput({ name: 'a', label: 'A', field_type: 'foo' }).ok).toBe(false));
  it('rejects options on text fields', () => expect(validateFieldInput({ name: 'a', label: 'A', field_type: 'text', options: [{ value: 'x', label: 'x' }] }).ok).toBe(false));
  it('accepts select with options', () => expect(validateFieldInput({ name: 'a', label: 'A', field_type: 'select', options: [{ value: 'x', label: 'X' }] }).ok).toBe(true));
  it('rejects duplicate option values', () => expect(validateOptions('select', [{ value: 'x', label: 'X' }, { value: 'x', label: 'Y' }]).ok).toBe(false));
  it('rejects invalid names', () => expect(validateFieldInput({ name: '1a', label: 'A', field_type: 'text' }).ok).toBe(false));
});

describe('validateRecordData', () => {
  it('requires required fields', () => expect(validateRecordData(fields, {}, false).ok).toBe(false));
  it('rejects unknown keys', () => expect(validateRecordData(fields, { title: 'a', nope: 1 }, false).ok).toBe(false));
  it('type-checks values', () => {
    expect(validateRecordData(fields, { title: 'a', amount: 'x' }, false).ok).toBe(false);
    expect(validateRecordData(fields, { title: 'a', stage: 'bad' }, false).ok).toBe(false);
    expect(validateRecordData(fields, { title: 'a', amount: 5, stage: 'new' }, false).ok).toBe(true);
  });
  it('partial skips required', () => expect(validateRecordData(fields, { amount: 1 }, true).ok).toBe(true));
});

describe('parseFilters whitelist', () => {
  it('accepts whitelisted field/op', () => {
    const r = parseFilters(JSON.stringify([{ field: 'amount', op: 'gt', value: 5 }]), fields);
    expect(r).toEqual({ ok: true, value: [{ column: 'data->amount', operator: 'gt', value: 5 }] });
  });
  it('rejects unknown fields (no injection via names)', () => {
    expect(parseFilters([{ field: 'amount);drop', op: 'eq', value: 1 }], fields).ok).toBe(false);
    expect(parseFilters([{ field: 'user_id', op: 'eq', value: 'x' }], fields).ok).toBe(false);
  });
  it('rejects unknown operators and bad types', () => {
    expect(parseFilters([{ field: 'title', op: 'regex', value: 'x' }], fields).ok).toBe(false);
    expect(parseFilters([{ field: 'amount', op: 'eq', value: '5' }], fields).ok).toBe(false);
    expect(parseFilters([{ field: 'title', op: 'gt', value: 'a' }], fields).ok).toBe(false);
    expect(parseFilters([{ field: 'meta', op: 'contains', value: 'a' }], fields).ok).toBe(false);
  });
  it('escapes LIKE wildcards', () => {
    const r: any = parseFilters([{ field: 'title', op: 'contains', value: '50%_' }], fields);
    expect(r.value[0].value).toBe('%50\\%\\_%');
  });
  it('caps filter count and rejects invalid JSON', () => {
    expect(parseFilters(Array(11).fill({ field: 'title', op: 'eq', value: 'a' }), fields).ok).toBe(false);
    expect(parseFilters('{nope', fields).ok).toBe(false);
  });
  it('handles empty', () => expect(parseFilters(undefined, fields)).toEqual({ ok: true, value: [] }));
});

describe('cursor', () => {
  const row = { created_at: '2026-01-01T00:00:00.000Z', id: '123e4567-e89b-12d3-a456-426614174000' };
  it('round trips', () => expect(decodeCursor(encodeCursor(row))).toEqual(row));
  it('rejects tampered values', () => {
    const bad = Buffer.from(JSON.stringify({ c: '2026-01-01T00:00:00Z),id.gt.(', i: row.id })).toString('base64url');
    expect(decodeCursor(bad)).toBeNull();
    expect(decodeCursor('garbage')).toBeNull();
  });
});

describe('permissions', () => {
  const perms = [{ object_type: 'contacts', can_read: true, can_create: false, can_update: true, can_delete: false }];
  it('owner (null) can do anything', () => expect(canDo(null, 'x', 'delete')).toBe(true));
  it('member limited to grants', () => {
    expect(canDo(perms, 'contacts', 'read')).toBe(true);
    expect(canDo(perms, 'contacts', 'create')).toBe(false);
    expect(canDo(perms, 'deals', 'read')).toBe(false);
  });
  it('masks non-readable fields', () => {
    const fp = [{ object_type: 'o', field: 'secret', can_read: false, can_write: false }];
    expect(maskData(fp, 'o', { secret: 1, ok: 2 })).toEqual({ ok: 2 });
  });
});

describe('misc', () => {
  it('clampLimit', () => { expect(clampLimit('999')).toBe(200); expect(clampLimit('x')).toBe(50); });
  it('validateEmail', () => { expect(validateEmail('A@b.co')).toBe('a@b.co'); expect(validateEmail('nope')).toBeNull(); });
});
