import { describe, expect, it } from 'vitest';
import { toCreateCommand, toPatchCommand } from './command.js';
import type { CreateBody, PatchBody, PatchParams } from './schema.js';

describe('toCreateCommand', () => {
  it('maps a validated CREATE body and context into a Domain Command', () => {
    const body: CreateBody = {
      targetType: 'JOB',
      action: 'CREATE',
      template: 'JOB_PUBLISHED',
      channelId: 'channel-1',
      roleIds: ['role-1'],
      data: { title: '공고' },
    };

    const command = toCreateCommand(body, { requestId: 'req-1', idempotencyKey: 'idem-1' });

    expect(command).toEqual({
      action: 'CREATE',
      targetType: 'JOB',
      template: 'JOB_PUBLISHED',
      channelId: 'channel-1',
      roleIds: ['role-1'],
      data: { title: '공고' },
      requestId: 'req-1',
      idempotencyKey: 'idem-1',
    });
  });
});

describe('toPatchCommand', () => {
  it('maps a validated PATCH body/params and context into a Domain Command', () => {
    const body: PatchBody = {
      targetType: 'PROGRAM',
      action: 'CLOSE_NOTICE',
      template: 'PROGRAM_CLOSED',
      channelId: 'channel-2',
      data: { reason: '모집 마감' },
    };
    const params: PatchParams = { messageId: 'message-1' };

    const command = toPatchCommand(body, params, { requestId: 'req-2' });

    expect(command).toEqual({
      action: 'CLOSE_NOTICE',
      targetType: 'PROGRAM',
      template: 'PROGRAM_CLOSED',
      channelId: 'channel-2',
      messageId: 'message-1',
      data: { reason: '모집 마감' },
      requestId: 'req-2',
    });
  });
});
