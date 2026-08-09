import { describe, expect, it } from 'vitest';
import { notImplementedDiscordMessageCommandHandler } from './handler.js';
import { ApiError } from './error.js';
import type { CreateDiscordMessageCommand, PatchDiscordMessageCommand } from './types.js';

const createCommand: CreateDiscordMessageCommand = {
  action: 'CREATE',
  targetType: 'JOB',
  template: 'JOB_PUBLISHED',
  channelId: 'channel-1',
  roleIds: [],
  data: {},
  requestId: 'req-1',
  idempotencyKey: 'idem-1',
};

const patchCommand: PatchDiscordMessageCommand = {
  action: 'UPDATE',
  targetType: 'JOB',
  template: 'JOB_UPDATED',
  channelId: 'channel-1',
  messageId: 'message-1',
  data: {},
  requestId: 'req-2',
};

describe('notImplementedDiscordMessageCommandHandler', () => {
  it('rejects handleCreate with a non-retryable INTERNAL_ERROR', async () => {
    await expect(
      notImplementedDiscordMessageCommandHandler.handleCreate(createCommand),
    ).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      retryable: false,
    });
  });

  it('rejects handlePatch with a non-retryable INTERNAL_ERROR', async () => {
    await expect(
      notImplementedDiscordMessageCommandHandler.handlePatch(patchCommand),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
