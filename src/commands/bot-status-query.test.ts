import { describe, expect, it } from 'vitest';
import type { Client } from 'discord.js';
import { DiscordJsBotStatusQuery } from './bot-status-query.js';

function fakeClient(overrides: Record<string, unknown>): Client {
  return {
    isReady: () => false,
    ws: { ping: -1 },
    guilds: { cache: { size: 0 } },
    ...overrides,
  } as unknown as Client;
}

describe('DiscordJsBotStatusQuery', () => {
  it('reports connected with a valid ping and guild count when ready', () => {
    const client = fakeClient({
      isReady: () => true,
      ws: { ping: 42 },
      guilds: { cache: { size: 2 } },
    });

    const snapshot = new DiscordJsBotStatusQuery(client).getSnapshot();

    expect(snapshot).toEqual({ connected: true, ping: 42, guildCount: 2 });
  });

  it('reports disconnected with a null ping when not ready', () => {
    const client = fakeClient({ isReady: () => false, ws: { ping: -1 } });

    const snapshot = new DiscordJsBotStatusQuery(client).getSnapshot();

    expect(snapshot.connected).toBe(false);
    expect(snapshot.ping).toBeNull();
  });

  it('treats a negative ping as unavailable even if somehow marked ready', () => {
    const client = fakeClient({ isReady: () => true, ws: { ping: -1 } });

    const snapshot = new DiscordJsBotStatusQuery(client).getSnapshot();

    expect(snapshot.ping).toBeNull();
  });

  it('reflects the actual guild cache size', () => {
    const client = fakeClient({
      isReady: () => true,
      ws: { ping: 5 },
      guilds: { cache: { size: 7 } },
    });

    const snapshot = new DiscordJsBotStatusQuery(client).getSnapshot();

    expect(snapshot.guildCount).toBe(7);
  });
});
