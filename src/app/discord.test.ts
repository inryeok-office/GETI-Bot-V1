import { describe, expect, it } from 'vitest';
import { GatewayIntentBits } from 'discord.js';
import { createDiscordClient, isDiscordConnected } from './discord.js';

describe('createDiscordClient', () => {
  it('requests exactly the intents required for Guild message + prefix command handling', () => {
    const client = createDiscordClient();

    expect(client.options.intents.has(GatewayIntentBits.Guilds)).toBe(true);
    expect(client.options.intents.has(GatewayIntentBits.GuildMessages)).toBe(true);
    expect(client.options.intents.has(GatewayIntentBits.MessageContent)).toBe(true);
  });

  it('does not request unnecessary privileged intents', () => {
    const client = createDiscordClient();

    expect(client.options.intents.has(GatewayIntentBits.GuildMembers)).toBe(false);
    expect(client.options.intents.has(GatewayIntentBits.GuildPresences)).toBe(false);
  });

  it('is not connected before login', () => {
    const client = createDiscordClient();
    expect(isDiscordConnected(client)).toBe(false);
  });
});
