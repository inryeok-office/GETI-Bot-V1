import Fastify from 'fastify';
import type { Logger } from 'pino';

export interface CreateServerOptions {
  logger: Logger;
  /**
   * Discord Client 연결 상태를 조회한다.
   * 제공되지 않으면(Discord Token 미설정 등) 응답에서 discord 필드를 생략한다.
   */
  getDiscordStatus?: () => 'CONNECTED' | 'DISCONNECTED';
}

/**
 * Fastify Application을 생성한다.
 * index.ts에서 직접 Route/Plugin을 등록하지 않고 이 함수로 책임을 분리한다.
 */
export function createServer(options: CreateServerOptions) {
  const { logger, getDiscordStatus } = options;

  const app = Fastify({
    loggerInstance: logger,
  });

  app.get('/health', async () => {
    const body: Record<string, string> = {
      status: 'UP',
      service: 'geti-discord-bot',
    };

    if (getDiscordStatus) {
      body.discord = getDiscordStatus();
    }

    return body;
  });

  return app;
}
