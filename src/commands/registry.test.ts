import { describe, expect, it } from 'vitest';
import { CommandRegistry } from './registry.js';
import type { DiscordTextCommand } from './types.js';

function fakeCommand(name: string): DiscordTextCommand {
  return {
    name,
    usage: `!${name}`,
    description: `${name} description`,
    execute: async () => {},
  };
}

describe('CommandRegistry', () => {
  it('finds a registered command by name', () => {
    const registry = new CommandRegistry();
    const command = fakeCommand('명령어');
    registry.register(command);

    expect(registry.find('명령어')).toBe(command);
  });

  it('returns undefined for an unregistered command name', () => {
    const registry = new CommandRegistry();
    expect(registry.find('없는명령어')).toBeUndefined();
  });

  it('lists all registered commands, reflecting new registrations automatically', () => {
    const registry = new CommandRegistry();
    registry.register(fakeCommand('명령어'));

    expect(registry.list()).toHaveLength(1);

    registry.register(fakeCommand('상태 봇'));
    expect(registry.list()).toHaveLength(2);
    expect(registry.list().map((command) => command.name)).toEqual(['명령어', '상태 봇']);
  });
});
