import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../internal-api/error.js';
import type {
  CreateDiscordMessageCommand,
  PatchDiscordMessageCommand,
} from '../internal-api/types.js';
import { DiscordDeliveryCommandHandler } from './command-handler.js';
import type { DiscordMessageAdapter, DiscordSendPayload } from './types.js';

function fakeAdapter(): DiscordMessageAdapter {
  return {
    sendMessage: vi.fn().mockResolvedValue('sent-message-id'),
    editMessage: vi.fn().mockResolvedValue('edited-message-id'),
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

describe('DiscordDeliveryCommandHandler.handleCreate', () => {
  it('sends a message without mention content when roleIds is empty', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    const result = await handler.handleCreate(baseCreateCommand);

    expect(result).toEqual({ messageId: 'sent-message-id' });
    const [channelId, payload] = (adapter.sendMessage as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, DiscordSendPayload];
    expect(channelId).toBe('channel-1');
    expect(payload.content).toBeUndefined();
    expect(payload.allowedMentions).toEqual({ parse: [], roles: [] });
    expect(payload.embeds.length).toBeGreaterThan(0);
  });

  it('includes mention content and allowedMentions.roles when roleIds is non-empty', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    await handler.handleCreate({ ...baseCreateCommand, roleIds: ['role-1', 'role-2'] });

    const [, payload] = (adapter.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      DiscordSendPayload,
    ];
    expect(payload.content).toBe('<@&role-1> <@&role-2>');
    expect(payload.allowedMentions).toEqual({ parse: [], roles: ['role-1', 'role-2'] });
  });

  it('throws INVALID_REQUEST when the template data fails Renderer validation', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    await expect(
      handler.handleCreate({ ...baseCreateCommand, data: { jobId: 'job-1' } }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    expect(adapter.sendMessage).not.toHaveBeenCalled();
  });

  it('propagates adapter errors (e.g. Discord API failures) unchanged', async () => {
    const adapter = fakeAdapter();
    adapter.sendMessage = vi.fn().mockRejectedValue(new ApiError('CHANNEL_NOT_FOUND', 'not found'));
    const handler = new DiscordDeliveryCommandHandler(adapter);

    await expect(handler.handleCreate(baseCreateCommand)).rejects.toMatchObject({
      code: 'CHANNEL_NOT_FOUND',
    });
  });
});

describe('DiscordDeliveryCommandHandler.handlePatch', () => {
  it('never includes mention content or allowed role mentions', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    const result = await handler.handlePatch(basePatchCommand);

    expect(result).toEqual({ messageId: 'edited-message-id' });
    const [channelId, messageId, payload] = (adapter.editMessage as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, string, DiscordSendPayload];
    expect(channelId).toBe('channel-1');
    expect(messageId).toBe('message-1');
    expect(payload.content).toBeUndefined();
    expect(payload.allowedMentions).toEqual({ parse: [], roles: [] });
  });

  it('renders CLOSE_NOTICE/DELETE_NOTICE templates without touching the mention policy', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    await handler.handlePatch({
      ...basePatchCommand,
      action: 'DELETE_NOTICE',
      template: 'JOB_DELETED',
    });

    const [, , payload] = (adapter.editMessage as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      string,
      DiscordSendPayload,
    ];
    expect(payload.allowedMentions).toEqual({ parse: [], roles: [] });
  });

  it('throws INVALID_REQUEST when the template data fails Renderer validation', async () => {
    const adapter = fakeAdapter();
    const handler = new DiscordDeliveryCommandHandler(adapter);

    await expect(handler.handlePatch({ ...basePatchCommand, data: {} })).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(adapter.editMessage).not.toHaveBeenCalled();
  });
});
