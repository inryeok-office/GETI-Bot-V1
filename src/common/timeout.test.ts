import { describe, expect, it } from 'vitest';
import { withTimeout } from './timeout.js';

describe('withTimeout', () => {
  it('resolves with the original value when the promise finishes before the timeout', async () => {
    const result = await withTimeout(Promise.resolve('done'), 50, () => new Error('timed out'));
    expect(result).toBe('done');
  });

  it('rejects with the original error when the promise rejects before the timeout', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('inner failure')), 50, () => new Error('timed out')),
    ).rejects.toThrow('inner failure');
  });

  it('rejects with the timeout error when the promise takes too long', async () => {
    const neverResolves = new Promise<string>(() => {
      // 의도적으로 resolve/reject하지 않는다.
    });

    await expect(withTimeout(neverResolves, 10, () => new Error('timed out'))).rejects.toThrow(
      'timed out',
    );
  });
});
