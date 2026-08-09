import type { Client } from 'discord.js';

/** `!상태 봇`이 표시할 공개 가능한 운영 지표만 담는다. */
export interface BotStatusSnapshot {
  connected: boolean;
  /** Gateway WebSocket Ping(ms). 값을 신뢰할 수 없으면 null. */
  ping: number | null;
  guildCount: number;
}

/**
 * `!상태 봇`이 discord.js Client에 직접 의존하지 않도록 하는 조회 계약.
 * Fake 구현으로 Discord Network 없이 Command를 Unit Test할 수 있다.
 */
export interface BotStatusQuery {
  getSnapshot(): BotStatusSnapshot;
}

export class DiscordJsBotStatusQuery implements BotStatusQuery {
  constructor(private readonly client: Client) {}

  getSnapshot(): BotStatusSnapshot {
    const connected = this.client.isReady();
    const rawPing = this.client.ws.ping;
    const ping = connected && Number.isFinite(rawPing) && rawPing >= 0 ? rawPing : null;

    return {
      connected,
      ping,
      guildCount: this.client.guilds.cache.size,
    };
  }
}
