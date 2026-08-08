import { describe, expect, it } from 'vitest';
import { GatewayIntentBits } from 'discord.js';
import { createDiscordClient, isDiscordConnected } from './discord.js';

describe('createDiscordClient', () => {
  it('only requests the minimal, non-privileged Guilds intent', () => {
    const client = createDiscordClient();

    expect(client.options.intents.has(GatewayIntentBits.Guilds)).toBe(true);
    expect(client.options.intents.has(GatewayIntentBits.GuildMembers)).toBe(false);
    expect(client.options.intents.has(GatewayIntentBits.MessageContent)).toBe(false);
    expect(client.options.intents.has(GatewayIntentBits.GuildPresences)).toBe(false);
  });

  it('is not connected before login', () => {
    const client = createDiscordClient();
    expect(isDiscordConnected(client)).toBe(false);
  });
});
