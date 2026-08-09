import { describe, expect, it, vi } from 'vitest';
import { createHelpCommand } from './help-command.js';
import { CommandRegistry } from './registry.js';
import type { CommandEmbed } from './types.js';

describe('createHelpCommand', () => {
  it('lists every registered command with its usage and description', async () => {
    const registry = new CommandRegistry();
    const helpCommand = createHelpCommand(registry);
    registry.register(helpCommand);
    registry.register({
      name: '상태 봇',
      usage: '!상태 봇',
      description: '현재 Discord Bot의 동작 상태를 확인합니다.',
      execute: async () => {},
    });

    let replied: CommandEmbed | undefined;
    await helpCommand.execute({
      reply: async (embed) => {
        replied = embed;
      },
    });

    expect(replied?.title).toBe('GETI Bot 명령어');
    expect(replied?.fields).toEqual([
      { name: '!명령어', value: '등록된 명령어 목록을 확인합니다.' },
      { name: '!상태 봇', value: '현재 Discord Bot의 동작 상태를 확인합니다.' },
    ]);
  });

  it('reflects newly registered commands automatically (Registry is the source of truth)', async () => {
    const registry = new CommandRegistry();
    const helpCommand = createHelpCommand(registry);
    registry.register(helpCommand);

    const reply = vi.fn();
    await helpCommand.execute({ reply });
    expect(reply.mock.calls[0][0].fields).toHaveLength(1);

    registry.register({
      name: '상태 봇',
      usage: '!상태 봇',
      description: 'desc',
      execute: async () => {},
    });

    await helpCommand.execute({ reply });
    expect(reply.mock.calls[1][0].fields).toHaveLength(2);
  });

  it('does not list the not-yet-implemented server status command', async () => {
    const registry = new CommandRegistry();
    const helpCommand = createHelpCommand(registry);
    registry.register(helpCommand);

    const reply = vi.fn();
    await helpCommand.execute({ reply });

    const names = reply.mock.calls[0][0].fields.map((field: { name: string }) => field.name);
    expect(names).not.toContain('!상태 서버');
  });
});
