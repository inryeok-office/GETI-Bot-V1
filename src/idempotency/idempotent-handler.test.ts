import { describe, expect, it, vi } from 'vitest';
import type { DiscordMessageCommandHandler } from '../internal-api/handler.js';
import type {
  CreateDiscordMessageCommand,
  PatchDiscordMessageCommand,
} from '../internal-api/types.js';
import { IdempotentDiscordMessageCommandHandler } from './idempotent-handler.js';
import { InMemoryIdempotencyStore } from './store.js';

function fakeInnerHandler(): DiscordMessageCommandHandler {
  return {
    handleCreate: vi.fn().mockResolvedValue({ messageId: 'created-message-id' }),
    handlePatch: vi.fn().mockResolvedValue({ messageId: 'edited-message-id' }),
  };
}

const baseCreateCommand: CreateDiscordMessageCommand = {
  action: 'CREATE',
  targetType: 'JOB',
  template: 'JOB_PUBLISHED',
  channelId: 'channel-1',
  roleIds: [],
  data: { jobId: 'job-1', title: '채용 공고' },
  requestId: 'req-1',
  idempotencyKey: 'idem-1',
};

const basePatchCommand: PatchDiscordMessageCommand = {
  action: 'UPDATE',
  targetType: 'JOB',
  template: 'JOB_UPDATED',
  channelId: 'channel-1',
  messageId: 'message-1',
  data: { jobId: 'job-1', title: '채용 공고' },
  requestId: 'req-2',
};

describe('IdempotentDiscordMessageCommandHandler.handleCreate', () => {
  it('calls the inner handler only once for repeated CREATE requests with the same idempotencyKey', async () => {
    const inner = fakeInnerHandler();
    const handler = new IdempotentDiscordMessageCommandHandler(
      inner,
      new InMemoryIdempotencyStore(),
    );

    const first = await handler.handleCreate(baseCreateCommand);
    const second = await handler.handleCreate({ ...baseCreateCommand, requestId: 'req-1-retry' });

    expect(first).toEqual({ messageId: 'created-message-id' });
    expect(second).toEqual({ messageId: 'created-message-id' });
    expect(inner.handleCreate).toHaveBeenCalledTimes(1);
  });

  it('calls the inner handler again for a different idempotencyKey', async () => {
    const inner = fakeInnerHandler();
    const handler = new IdempotentDiscordMessageCommandHandler(
      inner,
      new InMemoryIdempotencyStore(),
    );

    await handler.handleCreate(baseCreateCommand);
    await handler.handleCreate({ ...baseCreateCommand, idempotencyKey: 'idem-2' });

    expect(inner.handleCreate).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed CREATE, allowing a later retry to call the inner handler again', async () => {
    const inner = fakeInnerHandler();
    inner.handleCreate = vi
      .fn()
      .mockRejectedValueOnce(new Error('discord unavailable'))
      .mockResolvedValueOnce({ messageId: 'created-after-retry' });
    const handler = new IdempotentDiscordMessageCommandHandler(
      inner,
      new InMemoryIdempotencyStore(),
    );

    await expect(handler.handleCreate(baseCreateCommand)).rejects.toThrow('discord unavailable');
    const result = await handler.handleCreate(baseCreateCommand);

    expect(result).toEqual({ messageId: 'created-after-retry' });
    expect(inner.handleCreate).toHaveBeenCalledTimes(2);
  });
});

describe('IdempotentDiscordMessageCommandHandler.handlePatch', () => {
  it('always delegates to the inner handler without deduplication', async () => {
    const inner = fakeInnerHandler();
    const handler = new IdempotentDiscordMessageCommandHandler(
      inner,
      new InMemoryIdempotencyStore(),
    );

    await handler.handlePatch(basePatchCommand);
    await handler.handlePatch(basePatchCommand);

    expect(inner.handlePatch).toHaveBeenCalledTimes(2);
  });
});
