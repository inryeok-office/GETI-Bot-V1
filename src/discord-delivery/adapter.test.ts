import { describe, expect, it, vi } from 'vitest';
import type { Client } from 'discord.js';
import { DiscordJsMessageAdapter } from './adapter.js';
import type { DiscordSendPayload } from './types.js';

const basePayload: DiscordSendPayload = {
  embeds: [{ title: '테스트 제목' }],
  allowedMentions: { parse: [], roles: [] },
};

function fakeChannel(overrides: Record<string, unknown> = {}) {
  return {
    isTextBased: () => true,
    isDMBased: () => false,
    send: vi.fn().mockResolvedValue({ id: 'sent-message-id' }),
    messages: { fetch: vi.fn() },
    ...overrides,
  };
}

function fakeClient(channel: unknown): Client {
  return {
    channels: { fetch: vi.fn().mockResolvedValue(channel) },
  } as unknown as Client;
}

describe('DiscordJsMessageAdapter.sendMessage', () => {
  it('fetches the channel and sends the rendered embeds', async () => {
    const channel = fakeChannel();
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    const messageId = await adapter.sendMessage('channel-1', {
      ...basePayload,
      content: '<@&role-1>',
      allowedMentions: { parse: [], roles: ['role-1'] },
    });

    expect(messageId).toBe('sent-message-id');
    expect(channel.send).toHaveBeenCalledWith({
      content: '<@&role-1>',
      embeds: [{ title: '테스트 제목' }],
      allowedMentions: { parse: [], roles: ['role-1'] },
    });
  });

  it('throws CHANNEL_NOT_FOUND when the channel does not exist', async () => {
    const adapter = new DiscordJsMessageAdapter(fakeClient(null));

    await expect(adapter.sendMessage('channel-1', basePayload)).rejects.toMatchObject({
      code: 'CHANNEL_NOT_FOUND',
    });
  });

  it('throws CHANNEL_NOT_FOUND when the channel is DM-based', async () => {
    const channel = fakeChannel({ isDMBased: () => true });
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    await expect(adapter.sendMessage('channel-1', basePayload)).rejects.toMatchObject({
      code: 'CHANNEL_NOT_FOUND',
    });
  });

  it('maps a Discord API error thrown by send() to the Bot Error Contract', async () => {
    const channel = fakeChannel({
      send: vi.fn().mockRejectedValue({ code: 50013, message: 'Missing Permissions' }),
    });
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    await expect(adapter.sendMessage('channel-1', basePayload)).rejects.toMatchObject({
      code: 'MISSING_PERMISSION',
    });
  });
});

describe('DiscordJsMessageAdapter.editMessage', () => {
  it('fetches the channel and existing message, then edits it', async () => {
    const editedMessage = { id: 'edited-message-id' };
    const existingMessage = { edit: vi.fn().mockResolvedValue(editedMessage) };
    const channel = fakeChannel({
      messages: { fetch: vi.fn().mockResolvedValue(existingMessage) },
    });
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    const messageId = await adapter.editMessage('channel-1', 'message-1', basePayload);

    expect(messageId).toBe('edited-message-id');
    expect(channel.messages.fetch).toHaveBeenCalledWith('message-1');
    expect(existingMessage.edit).toHaveBeenCalledWith({
      embeds: [{ title: '테스트 제목' }],
      allowedMentions: { parse: [], roles: [] },
    });
  });

  it('omits the content key entirely when payload.content is undefined (does not clear existing content)', async () => {
    const existingMessage = { edit: vi.fn().mockResolvedValue({ id: 'edited-message-id' }) };
    const channel = fakeChannel({
      messages: { fetch: vi.fn().mockResolvedValue(existingMessage) },
    });
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    await adapter.editMessage('channel-1', 'message-1', { ...basePayload, content: undefined });

    const options = existingMessage.edit.mock.calls[0][0];
    expect('content' in options).toBe(false);
  });

  it('throws MESSAGE_NOT_FOUND when the message fetch fails with UnknownMessage', async () => {
    const channel = fakeChannel({
      messages: { fetch: vi.fn().mockRejectedValue({ code: 10008, message: 'Unknown Message' }) },
    });
    const adapter = new DiscordJsMessageAdapter(fakeClient(channel));

    await expect(adapter.editMessage('channel-1', 'message-1', basePayload)).rejects.toMatchObject({
      code: 'MESSAGE_NOT_FOUND',
    });
  });

  it('throws CHANNEL_NOT_FOUND when the channel no longer exists', async () => {
    const adapter = new DiscordJsMessageAdapter(fakeClient(null));

    await expect(adapter.editMessage('channel-1', 'message-1', basePayload)).rejects.toMatchObject({
      code: 'CHANNEL_NOT_FOUND',
    });
  });
});
