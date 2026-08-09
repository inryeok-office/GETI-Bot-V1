import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createBotStatusCommand } from './bot-status-command.js';
import type { BotStatusQuery, BotStatusSnapshot } from './bot-status-query.js';
import type { CommandEmbed } from './types.js';

function fakeQuery(snapshot: BotStatusSnapshot): BotStatusQuery {
  return { getSnapshot: () => snapshot };
}

async function runStatusCommand(
  snapshot: BotStatusSnapshot,
  nodeEnv = 'test',
): Promise<CommandEmbed> {
  const command = createBotStatusCommand({ statusQuery: fakeQuery(snapshot), nodeEnv });
  let replied: CommandEmbed | undefined;
  await command.execute({
    reply: async (embed) => {
      replied = embed;
    },
  });
  if (!replied) throw new Error('command did not reply');
  return replied;
}

function fieldValue(embed: CommandEmbed, name: string): string | undefined {
  return embed.fields?.find((field) => field.name === name)?.value;
}

describe('createBotStatusCommand', () => {
  it('shows a normal status when Discord is connected', async () => {
    const embed = await runStatusCommand({ connected: true, ping: 42, guildCount: 1 });

    expect(fieldValue(embed, '상태')).toBe('🟢 정상');
    expect(fieldValue(embed, 'Discord')).toBe('CONNECTED');
  });

  it('shows a disconnected status when Discord is not connected', async () => {
    const embed = await runStatusCommand({ connected: false, ping: null, guildCount: 0 });

    expect(fieldValue(embed, '상태')).toBe('🔴 연결 끊김');
    expect(fieldValue(embed, 'Discord')).toBe('DISCONNECTED');
  });

  it('shows the actual ping value in ms', async () => {
    const embed = await runStatusCommand({ connected: true, ping: 17, guildCount: 1 });
    expect(fieldValue(embed, 'Gateway Ping')).toBe('17ms');
  });

  it('shows a safe placeholder when ping is unavailable', async () => {
    const embed = await runStatusCommand({ connected: false, ping: null, guildCount: 0 });
    expect(fieldValue(embed, 'Gateway Ping')).toBe('확인 불가');
  });

  it('shows the actual guild count', async () => {
    const embed = await runStatusCommand({ connected: true, ping: 10, guildCount: 3 });
    expect(fieldValue(embed, '연결 서버')).toBe('3개');
  });

  it('formats uptime using process.uptime()', async () => {
    const uptimeSpy = vi.spyOn(process, 'uptime').mockReturnValue(12 * 60);
    const embed = await runStatusCommand({ connected: true, ping: 10, guildCount: 1 });

    expect(fieldValue(embed, 'Uptime')).toBe('12분');
    uptimeSpy.mockRestore();
  });

  it('reflects package.json version', async () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string };
    const embed = await runStatusCommand({ connected: true, ping: 10, guildCount: 1 });

    expect(fieldValue(embed, 'Version')).toBe(packageJson.version);
  });

  it('reflects the provided NODE_ENV', async () => {
    const embed = await runStatusCommand(
      { connected: true, ping: 10, guildCount: 1 },
      'production',
    );
    expect(fieldValue(embed, 'Environment')).toBe('production');
  });

  it('never includes secret-shaped keys in the embed', async () => {
    const embed = await runStatusCommand({ connected: true, ping: 10, guildCount: 1 });
    const serialized = JSON.stringify(embed).toLowerCase();

    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('apikey');
    expect(serialized).not.toContain('api_key');
  });
});
