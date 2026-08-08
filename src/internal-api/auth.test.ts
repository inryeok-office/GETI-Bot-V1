import { describe, expect, it } from 'vitest';
import { isValidInternalApiKey } from './auth.js';

describe('isValidInternalApiKey', () => {
  it('returns true for a matching key', () => {
    expect(isValidInternalApiKey('secret-key', 'secret-key')).toBe(true);
  });

  it('returns false for a mismatching key', () => {
    expect(isValidInternalApiKey('wrong-key', 'secret-key')).toBe(false);
  });

  it('returns false when candidate is undefined', () => {
    expect(isValidInternalApiKey(undefined, 'secret-key')).toBe(false);
  });

  it('returns false when candidate is empty', () => {
    expect(isValidInternalApiKey('', 'secret-key')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(isValidInternalApiKey('short', 'much-longer-secret-key')).toBe(false);
  });
});
