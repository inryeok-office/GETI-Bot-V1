import { Client, GatewayIntentBits } from 'discord.js';
import type { Logger } from 'pino';

/**
 * Discord Client를 생성한다.
 *
 * 이 Bot은 GETI Server로부터 받은 명령을 Discord 메시지로 전달하는 outbound
 * 용도에 더해, `!` Prefix Command로 Guild 채팅 메시지를 읽어야 한다. 따라서
 * Guild 조회(`Guilds`), Guild Message 수신(`GuildMessages`), 그 메시지의
 * 실제 content 조회(`MessageContent`)까지가 필요한 최소 Intent다.
 * GuildMembers / GuildPresences 등 이번 기능에 불필요한 Privileged Intent는
 * 사용하지 않는다.
 *
 * `MessageContent`는 Discord Privileged Gateway Intent이므로, Discord
 * Developer Portal(Bot → Privileged Gateway Intents)에서도 별도로 켜야
 * 실제로 메시지 내용을 받을 수 있다.
 */
export function createDiscordClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
}

/**
 * Discord Client를 로그인시킨다.
 * Client 생성과 로그인 생명주기를 분리해 테스트 가능성을 확보한다.
 */
export async function connectDiscordClient(client: Client, token: string): Promise<void> {
  await client.login(token);
}

/**
 * 현재 Discord Client의 연결 상태를 조회한다.
 */
export function isDiscordConnected(client: Client): boolean {
  return client.isReady();
}

/**
 * Discord Client 연결을 안전하게 종료한다.
 */
export async function disconnectDiscordClient(client: Client, logger: Logger): Promise<void> {
  try {
    client.destroy();
  } catch (error) {
    logger.error({ err: error }, 'Failed to destroy Discord client');
  }
}
