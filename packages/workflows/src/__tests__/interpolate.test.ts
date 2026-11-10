import { describe, it, expect } from 'vitest';
import { interpolate, interpolateString, getPath } from '../engine/interpolate';

const scope = {
  trigger: { email: 'a@b.co', n: 3, tags: ['x', 'y'], nested: { deep: 'v' } },
  steps: { s1: { output: { id: 42, text: 'he said "hi"' } } },
  record: { name: 'Ann' },
};

describe('interpolate', () => {
  it('resolves trigger, steps and record paths', () => {
    expect(interpolateString('Hi {{record.name}} <{{trigger.email}}>', scope)).toBe('Hi Ann <a@b.co>');
    expect(interpolateString('{{steps.s1.output.id}}', scope)).toBe(42);
    expect(interpolateString('{{ trigger.nested.deep }}', scope)).toBe('v');
    expect(interpolateString('{{trigger.tags[1]}}', scope)).toBe('y');
  });

  it('keeps raw types for whole-string expressions and stringifies inside text', () => {
    expect(interpolateString('{{trigger.tags}}', scope)).toEqual(['x', 'y']);
    expect(interpolateString('t={{trigger.tags}}', scope)).toBe('t=["x","y"]');
    expect(interpolateString('n={{trigger.n}}', scope)).toBe('n=3');
  });

  it('renders missing values as empty and unknown roots untouched-safe', () => {
    expect(interpolateString('a{{trigger.nope}}b', scope)).toBe('ab');
    expect(interpolateString('{{trigger.nope}}', scope)).toBeUndefined();
  });

  it('supports backslash escaping', () => {
    expect(interpolateString('literal \\{{trigger.email}}', scope)).toBe('literal {{trigger.email}}');
  });

  it('never evaluates code or follows the prototype chain', () => {
    expect(interpolateString('{{constructor.name}}', scope)).toBeUndefined();
    expect(interpolateString('x{{constructor.name}}', scope)).toBe('x');
    expect(interpolateString('{{trigger.__proto__}}', scope)).toBeUndefined();
    expect(getPath(scope, 'trigger.constructor')).toBeUndefined();
    expect(getPath({}, 'toString')).toBeUndefined();
    expect(interpolateString('{{ 1+1 }}', scope)).toBe('{{ 1+1 }}');
    expect(interpolateString('{{ process.exit() }}', scope)).toBe('{{ process.exit() }}');
    expect(interpolateString('{{trigger.email.length}}', scope)).toBeUndefined();
  });

  it('JSON-escapes substituted strings when asked', () => {
    const out = interpolateString('{"t":"{{steps.s1.output.text}}"}', scope, { escapeJson: true }) as string;
    expect(JSON.parse(out)).toEqual({ t: 'he said "hi"' });
  });

  it('walks objects and arrays, skipping given keys and dropping dangerous keys', () => {
    const out = interpolate(
      { a: ['{{record.name}}'], steps: [{ x: '{{record.name}}' }], ['__proto__']: 'x' },
      scope,
      { skipKeys: ['steps'] }
    ) as any;
    expect(out.a).toEqual(['Ann']);
    expect(out.steps[0].x).toBe('{{record.name}}');
    expect(Object.keys(out)).not.toContain('__proto__');
  });
});
