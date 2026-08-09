import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import type { Message } from 'discord.js';
import { dispatchMessage, registerCommandListener } from './dispatcher.js';
import { CommandRegistry } from './registry.js';
import type { DiscordTextCommand } from './types.js';

const logger = pino({ level: 'silent' });

function fakeMessage(overrides: Record<string, unknown> = {}): Message {
  return {
    content: '',
    author: { bot: false },
    webhookId: null,
    guildId: 'guild-1',
    channelId: 'channel-1',
    inGuild: () => true,
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Message;
}

function statusCommand(
  execute: DiscordTextCommand['execute'] = async () => {},
): DiscordTextCommand {
  return { name: '상태 봇', usage: '!상태 봇', description: 'desc', execute };
}

describe('dispatchMessage', () => {
  it('executes the matching registered command', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn().mockResolvedValue(undefined);
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '!상태 봇' });

    await dispatchMessage(message, registry, logger);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('collapses extra whitespace before matching the command', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn().mockResolvedValue(undefined);
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '!상태    봇' });

    await dispatchMessage(message, registry, logger);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('replies via message.reply without pinging the author', async () => {
    const registry = new CommandRegistry();
    registry.register(
      statusCommand(async (context) => {
        await context.reply({ title: 't', fields: [] });
      }),
    );
    const message = fakeMessage({ content: '!상태 봇' });

    await dispatchMessage(message, registry, logger);

    expect(message.reply).toHaveBeenCalledWith(
      expect.objectContaining({ allowedMentions: { repliedUser: false } }),
    );
  });

  it('ignores a normal chat message', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '안녕하세요' });

    await dispatchMessage(message, registry, logger);

    expect(execute).not.toHaveBeenCalled();
    expect(message.reply).not.toHaveBeenCalled();
  });

  it('ignores messages from other bots', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '!상태 봇', author: { bot: true } });

    await dispatchMessage(message, registry, logger);

    expect(execute).not.toHaveBeenCalled();
  });

  it('ignores webhook messages', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '!상태 봇', webhookId: 'webhook-1' });

    await dispatchMessage(message, registry, logger);

    expect(execute).not.toHaveBeenCalled();
  });

  it('ignores DMs', async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(statusCommand(execute));
    const message = fakeMessage({ content: '!상태 봇', inGuild: () => false });

    await dispatchMessage(message, registry, logger);

    expect(execute).not.toHaveBeenCalled();
  });

  it('replies with a short message for an unknown command instead of throwing', async () => {
    const registry = new CommandRegistry();
    const message = fakeMessage({ content: '!없는명령어' });

    await expect(dispatchMessage(message, registry, logger)).resolves.toBeUndefined();
    expect(message.reply).toHaveBeenCalledTimes(1);
  });

  it('does not crash when command execution throws (Bot process keeps running)', async () => {
    const registry = new CommandRegistry();
    registry.register(
      statusCommand(async () => {
        throw new Error('boom');
      }),
    );
    const message = fakeMessage({ content: '!상태 봇' });

    await expect(dispatchMessage(message, registry, logger)).resolves.toBeUndefined();
  });

  it('does not crash when message.reply itself fails (e.g. missing permission)', async () => {
    const registry = new CommandRegistry();
    registry.register(
      statusCommand(async (context) => {
        await context.reply({ title: 't', fields: [] });
      }),
    );
    const message = fakeMessage({
      content: '!상태 봇',
      reply: vi.fn().mockRejectedValue(new Error('Missing Permissions')),
    });

    await expect(dispatchMessage(message, registry, logger)).resolves.toBeUndefined();
  });
});

describe('registerCommandListener', () => {
  it('subscribes to messageCreate on the client', () => {
    const on = vi.fn();
    const client = { on } as unknown as Parameters<typeof registerCommandListener>[0];
    const registry = new CommandRegistry();

    registerCommandListener(client, registry, logger);

    expect(on).toHaveBeenCalledWith('messageCreate', expect.any(Function));
  });
});
