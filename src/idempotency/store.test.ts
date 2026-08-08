import { describe, expect, it, vi } from 'vitest';
import { InMemoryIdempotencyStore } from './store.js';

describe('InMemoryIdempotencyStore', () => {
  it('calls factory and returns its result for a new key', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    const factory = vi.fn().mockResolvedValue('result-1');

    const result = await store.getOrCreate('key-1', factory);

    expect(result).toBe('result-1');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('reuses the cached result for the same key without calling factory again', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    const factory = vi.fn().mockResolvedValue('result-1');

    await store.getOrCreate('key-1', factory);
    const second = await store.getOrCreate('key-1', factory);

    expect(second).toBe('result-1');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('calls factory again for a different key', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    const factory = vi.fn().mockResolvedValueOnce('result-1').mockResolvedValueOnce('result-2');

    const first = await store.getOrCreate('key-1', factory);
    const second = await store.getOrCreate('key-2', factory);

    expect(first).toBe('result-1');
    expect(second).toBe('result-2');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('runs the factory exactly once when two requests for the same key race concurrently', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    let resolveFactory!: (value: string) => void;
    const factory = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFactory = resolve;
        }),
    );

    // 두 요청을 거의 동시에 시작한다 (둘 다 factory의 Promise가 resolve되기 전).
    const first = store.getOrCreate('key-1', factory);
    const second = store.getOrCreate('key-1', factory);

    resolveFactory('shared-result');

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe('shared-result');
    expect(secondResult).toBe('shared-result');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('removes a failed attempt so a later call with the same key retries the factory', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('result-after-retry');

    await expect(store.getOrCreate('key-1', factory)).rejects.toThrow('boom');
    const result = await store.getOrCreate('key-1', factory);

    expect(result).toBe('result-after-retry');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('exposes the current number of stored entries via size', async () => {
    const store = new InMemoryIdempotencyStore<string>();
    expect(store.size).toBe(0);

    await store.getOrCreate('key-1', () => Promise.resolve('a'));
    expect(store.size).toBe(1);

    await store.getOrCreate('key-2', () => Promise.resolve('b'));
    expect(store.size).toBe(2);
  });
});
