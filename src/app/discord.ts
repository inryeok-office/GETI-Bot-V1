import { Client, GatewayIntentBits } from 'discord.js';
import type { Logger } from 'pino';

/**
 * Discord Client를 생성한다.
 *
 * 이 Bot은 GETI Server로부터 받은 명령을 Discord 메시지로 전달하는
 * outbound 용도이므로, Guild 조회에 필요한 최소 Intent만 사용한다.
 * GuildMembers / MessageContent / GuildPresences 등 Privileged Intent는
 * 사용하지 않는다.
 */
export function createDiscordClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
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
