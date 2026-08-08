import { describe, expect, it } from 'vitest';
import { EMBED_LIMITS, truncate } from './limits.js';

describe('truncate', () => {
  it('returns trimmed text unchanged when within the limit', () => {
    expect(truncate('  hello  ', 10)).toBe('hello');
  });

  it('truncates text longer than the limit and appends an ellipsis', () => {
    const result = truncate('a'.repeat(300), EMBED_LIMITS.TITLE);
    expect(result.length).toBe(EMBED_LIMITS.TITLE);
    expect(result.endsWith('…')).toBe(true);
  });

  it('never returns text longer than maxLength', () => {
    const result = truncate('x'.repeat(10), 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('handles maxLength of 1 without throwing', () => {
    expect(() => truncate('hello', 1)).not.toThrow();
    expect(truncate('hello', 1).length).toBe(1);
  });
});
